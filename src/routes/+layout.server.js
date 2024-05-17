export const load = async ({ url, locals: { session, supabaseAdmin, supabase, stripe } }) => {
  let balance;
  if (session) {
    let {data: balance} = await supabase.from('balances').select().eq('user_id', session.user.id).single();

    const payment_session_id = new URLSearchParams(url.search).get('session_id');
    if (payment_session_id) {
      try {
        // Non-atomic and exploitable. Probably a bad idea in production.
        const {status, amount_total} = await stripe.checkout.sessions.retrieve(payment_session_id);
        const {data: payment} = await supabaseAdmin.from('payments').select().eq('session_id', payment_session_id).single();
        if (payment && payment.status === 'PENDING_PAYMENT') {
          await supabaseAdmin.from('payments').update({
            amount: amount_total / 100,
            status: (""+status).toUpperCase(),
          }).eq('session_id', payment_session_id);

          const amount = balance.amount + amount_total / 100;
          const res = await supabaseAdmin.from('balances').update({amount}).eq('user_id', session.user.id);
          balance = res.data;
        } else {
          console.log('Payment not found or already processed', payment);
        }

      } catch (error) {
        console.error(error);
      }
    }
  }
  return {
    session,
    balance
  }
}