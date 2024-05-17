import { json } from "@sveltejs/kit";

export async function POST({ request, locals: {supabaseAdmin, user, stripe} }) {
    const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        ui_mode: 'embedded',
        line_items: [
          {
            price: 'price_1PHFQfFspKI3SJpmQbbxPNNd',
            quantity: 10,
            adjustable_quantity: {
              enabled: true,
            },
          },
        ],
        mode: 'payment',
        return_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      });
    const res = await supabaseAdmin.from('payments').insert({
        user_id: user.id,
        session_id: session.id,
    });
    console.log(res)
    return json({ clientSecret: session.client_secret })
}

export async function GET({}) {
}