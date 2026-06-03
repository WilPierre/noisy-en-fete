import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from './supabase';

const RESTAURANT = 'Noisy en Fête';
const stripePromise = loadStripe('pk_live_51TYLfRCdBcuJvSgRIp89A5ClD2gaO1vyBsuKRlZ5Hm23XzHkRmIyg2rW3EPrtEdkqKbcoXZDc0bnqnogl5ZXR0Kc00Ei1hUxSg');

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --cream: #FAF7F2; --dark: #1A1208; --gold: #C8953A; --gold-light: #E8B96A;
    --green: #2D5016; --red: #8B2020; --warm-gray: #8A7F72; --border: #E8E0D4;
    --blue: #1A4E7A;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--dark); }
  .app { min-height: 100vh; }

  .nav { background: var(--dark); padding: 0.75rem 1.5rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .nav-title { font-family: 'Playfair Display', serif; color: var(--gold); font-size: 1.1rem; margin-right: auto; }
  .nav-btn { padding: 0.4rem 1rem; border-radius: 100px; border: 1.5px solid transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; }
  .nav-btn.active { background: var(--gold); color: var(--dark); border-color: var(--gold); }
  .nav-btn:not(.active) { background: transparent; color: var(--warm-gray); border-color: #333; }
  .nav-btn:not(.active):hover { border-color: var(--gold); color: var(--gold); }

  .client-wrap { max-width: 480px; margin: 0 auto; padding: 1.5rem 1rem 6rem; }
  .hero { text-align: center; padding: 1.5rem 0 1rem; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--dark); }
  .hero-sub { color: var(--warm-gray); font-size: 0.85rem; margin-top: 0.3rem; }
  .table-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--gold); color: var(--dark); padding: 0.3rem 0.9rem; border-radius: 100px; font-size: 0.8rem; font-weight: 600; margin: 0.75rem 0 1.2rem; }

  .table-select-wrap { max-width: 400px; margin: 0 auto; padding: 2rem 1rem; text-align: center; }
  .table-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 1.5rem; }
  .table-btn { padding: 1.1rem 0.5rem; border-radius: 12px; border: 2px solid var(--border); background: white; cursor: pointer; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; transition: all 0.2s; }
  .table-btn:hover { border-color: var(--gold); background: var(--gold); color: white; }

  .category-tabs { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.2rem; }
  .category-tabs::-webkit-scrollbar { display: none; }
  .cat-tab { padding: 0.35rem 0.9rem; border-radius: 100px; border: 1.5px solid var(--border); background: white; font-size: 0.8rem; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .cat-tab.active { background: var(--dark); color: white; border-color: var(--dark); }

  .menu-grid { display: flex; flex-direction: column; gap: 0.75rem; }
  .menu-item { background: white; border: 1.5px solid var(--border); border-radius: 14px; padding: 1rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
  .menu-item:hover { border-color: var(--gold); }
  .item-emoji { font-size: 2rem; width: 44px; text-align: center; flex-shrink: 0; }
  .item-info { flex: 1; }
  .item-name { font-weight: 500; font-size: 0.95rem; }
  .item-price { color: var(--gold); font-weight: 600; font-size: 0.88rem; margin-top: 0.1rem; }
  .qty-ctrl { display: flex; align-items: center; gap: 0.5rem; }
  .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .qty-btn:hover { border-color: var(--gold); background: var(--gold); color: white; }
  .qty-num { width: 20px; text-align: center; font-weight: 600; font-size: 0.9rem; }

  .cart-bar { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); background: var(--dark); color: white; border-radius: 16px; padding: 1rem 1.5rem; width: calc(100% - 2rem); max-width: 440px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 32px rgba(0,0,0,0.25); cursor: pointer; transition: transform 0.2s; }
  .cart-bar:hover { transform: translateX(-50%) translateY(-2px); }
  .cart-count { background: var(--gold); color: var(--dark); border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; }
  .cart-total { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--gold); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 100; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from { opacity: 0; } }
  .modal { background: white; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; margin: 0 auto; padding: 1.5rem; max-height: 85vh; overflow-y: auto; animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1); }
  @keyframes slideUp { from { transform: translateY(100%); } }
  .modal-handle { width: 36px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 1.2rem; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 1rem; }
  .cart-line { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .cart-total-line { display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem; padding: 0.8rem 0; border-top: 2px solid var(--dark); margin-top: 0.5rem; }

  /* STRIPE CARD */
  .payment-section { margin-top: 1.2rem; }
  .payment-title { font-size: 0.85rem; font-weight: 600; color: var(--warm-gray); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem; }
  .card-element-wrap { background: var(--cream); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.9rem 1rem; transition: border-color 0.2s; }
  .card-element-wrap:focus-within { border-color: var(--gold); }
  .card-icons { display: flex; gap: 0.4rem; margin-bottom: 0.6rem; }
  .card-icon { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 0.15rem 0.4rem; font-size: 0.7rem; font-weight: 700; color: var(--dark); }
  .pay-btn { width: 100%; padding: 1rem; background: var(--gold); color: var(--dark); border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 1rem; font-family: 'DM Sans', sans-serif; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .pay-btn:hover:not(:disabled) { background: var(--gold-light); }
  .pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pay-error { color: var(--red); font-size: 0.82rem; margin-top: 0.6rem; padding: 0.5rem 0.75rem; background: #FFF0F0; border-radius: 8px; }
  .secure-badge { display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.72rem; color: var(--warm-gray); margin-top: 0.6rem; }

  .success-box { text-align: center; padding: 3rem 1rem; }
  .success-icon { font-size: 3.5rem; margin-bottom: 1rem; }
  .success-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 0.5rem; color: var(--green); }
  .success-sub { color: var(--warm-gray); font-size: 0.9rem; line-height: 1.6; }
  .new-order-btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 2rem; background: var(--gold); color: var(--dark); border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }

  .kitchen-wrap { padding: 1.5rem; }
  .view-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; }
  .view-sub { color: var(--warm-gray); font-size: 0.85rem; margin-top: 0.2rem; margin-bottom: 1.5rem; }
  .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .order-card { background: white; border-radius: 16px; padding: 1.2rem; border: 2px solid var(--border); }
  .order-card.attente { border-color: #E8A020; }
  .order-card.preparation { border-color: var(--blue); }
  .order-card.pret { border-color: var(--green); }
  .order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; }
  .order-table { font-family: 'Playfair Display', serif; font-size: 1.3rem; }
  .order-id { color: var(--warm-gray); font-size: 0.75rem; }
  .status-badge { padding: 0.25rem 0.7rem; border-radius: 100px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .badge-attente { background: #FFF3CD; color: #856404; }
  .badge-preparation { background: #D1ECF1; color: #0C5460; }
  .badge-pret { background: #D4EDDA; color: #155724; }
  .paid-badge { background: #D4EDDA; color: #155724; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 100px; font-weight: 600; }
  .order-items { margin-bottom: 1rem; }
  .order-item-line { font-size: 0.88rem; padding: 0.25rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
  .order-time { font-size: 0.75rem; color: var(--warm-gray); margin-bottom: 0.8rem; }
  .status-btns { display: flex; gap: 0.5rem; }
  .status-btn { flex: 1; padding: 0.5rem; border-radius: 8px; border: 1.5px solid var(--border); cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all 0.2s; font-family: 'DM Sans', sans-serif; background: white; }
  .status-btn:hover { border-color: var(--gold); background: var(--gold); color: white; }
  .status-btn.done { background: var(--green); color: white; border-color: var(--green); }
  .empty-state { text-align: center; padding: 3rem; color: var(--warm-gray); }
  .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .admin-wrap { padding: 1.5rem; max-width: 720px; }
  .admin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: white; border-radius: 14px; padding: 1.2rem; border: 1.5px solid var(--border); }
  .stat-num { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--gold); }
  .stat-label { font-size: 0.8rem; color: var(--warm-gray); margin-top: 0.2rem; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; margin: 1.5rem 0 1rem; }
  .menu-admin-item { background: white; border: 1.5px solid var(--border); border-radius: 12px; padding: 0.9rem 1rem; display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; }
  .menu-admin-info { flex: 1; }
  .menu-admin-name { font-weight: 500; font-size: 0.9rem; }
  .menu-admin-cat { font-size: 0.75rem; color: var(--warm-gray); }
  .menu-admin-price { font-weight: 700; color: var(--gold); font-size: 0.95rem; margin-right: 0.5rem; }
  .avail-toggle { padding: 0.25rem 0.6rem; border-radius: 6px; border: 1.5px solid var(--border); font-size: 0.75rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; background: white; }
  .avail-toggle.on { background: #D4EDDA; color: #155724; border-color: #C3E6CB; }
  .avail-toggle.off { background: #F8D7DA; color: #721C24; border-color: #F5C6CB; }
  .del-btn { padding: 0.3rem 0.6rem; background: transparent; border: 1.5px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: var(--red); transition: all 0.2s; }
  .del-btn:hover { background: var(--red); color: white; border-color: var(--red); }
  .add-item-form { background: white; border-radius: 14px; padding: 1.2rem; border: 1.5px solid var(--border); margin-top: 1rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
  .form-field { display: flex; flex-direction: column; gap: 0.3rem; }
  .form-field label { font-size: 0.78rem; color: var(--warm-gray); font-weight: 500; }
  .form-field input, .form-field select { padding: 0.55rem 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; background: var(--cream); transition: border-color 0.2s; outline: none; }
  .form-field input:focus, .form-field select:focus { border-color: var(--gold); }
  .add-btn { padding: 0.6rem 1.2rem; background: var(--dark); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: background 0.2s; }
  .add-btn:hover { background: var(--gold); color: var(--dark); }
  .qr-section { background: white; border-radius: 14px; padding: 1.5rem; border: 1.5px solid var(--border); margin-top: 1rem; text-align: center; }
  .qr-url { font-size: 0.78rem; color: var(--warm-gray); margin-top: 0.5rem; word-break: break-all; }
  .print-btn { padding: 0.6rem 1.5rem; background: var(--dark); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; margin-top: 1rem; transition: background 0.2s; }
  .print-btn:hover { background: var(--gold); color: var(--dark); }

  @media print {
    .nav, .admin-wrap > *:not(.qr-section) { display: none !important; }
    .qr-section { border: none; }
  }
  @media (max-width: 480px) {
    .admin-grid { grid-template-columns: 1fr 1fr; }
    .form-row { grid-template-columns: 1fr; }
  }
`;

// ─── STRIPE PAYMENT FORM ──────────────────────────────────────────────────────
function PaymentForm({ totalPrice, tableNum, cartItems, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setError('');
    setPaying(true);

    try {
      // 1. Créer la commande dans Supabase (status: en attente paiement)
      const { data: order, error: dbErr } = await supabase
        .from('orders')
        .insert({ table_num: tableNum, items: cartItems, total: totalPrice, paid: false, status: 'en attente paiement' })
        .select().single();
      if (dbErr) throw new Error('Erreur base de données');

      // 2. Créer le PaymentIntent via notre fonction Vercel
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totalPrice * 100), orderId: order.id, tableNum }),
      });
      const { clientSecret, error: apiErr } = await res.json();
      if (apiErr) throw new Error(apiErr);

      // 3. Confirmer le paiement CB
      const { error: stripeErr } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeErr) throw new Error(stripeErr.message);

      // 4. Marquer comme payé + envoyer en cuisine
      await supabase.from('orders').update({ paid: true, status: 'en attente' }).eq('id', order.id);
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setPaying(false);
  };

  return (
    <div className="payment-section">
      <div className="payment-title">💳 Paiement sécurisé par carte</div>
      <div className="card-icons">
        <span className="card-icon">VISA</span>
        <span className="card-icon">MC</span>
        <span className="card-icon">CB</span>
      </div>
      <div className="card-element-wrap">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#1A1208', fontFamily: 'DM Sans, sans-serif', '::placeholder': { color: '#8A7F72' } },
            invalid: { color: '#8B2020' },
          },
          hidePostalCode: true,
        }} />
      </div>
      {error && <div className="pay-error">⚠️ {error}</div>}
      <button className="pay-btn" onClick={handlePay} disabled={paying || !stripe}>
        {paying ? '⏳ Traitement...' : `🔒 Payer ${totalPrice.toFixed(2)} €`}
      </button>
      <div className="secure-badge">🔒 Paiement sécurisé par Stripe — vos données sont chiffrées</div>
    </div>
  );
}

// ─── TABLE SELECTOR ───────────────────────────────────────────────────────────
function TableSelector({ onSelect }) {
  return (
    <div className="table-select-wrap">
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem" }}>🪑 Votre table</div>
      <p style={{ color: "var(--warm-gray)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Quel est votre numéro de table ?</p>
      <div className="table-grid">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
          <button key={n} className="table-btn" onClick={() => onSelect(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
function ClientView() {
  const [tableNum, setTableNum] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [showCart, setShowCart] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('menu').select('*').eq('available', true).order('category').then(({ data }) => {
      if (data) setMenu(data);
      setLoading(false);
    });
  }, []);

  const categories = ['Tous', ...new Set(menu.map(i => i.category))];
  const filtered = activeCategory === 'Tous' ? menu : menu.filter(i => i.category === activeCategory);
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalPrice = menu.reduce((s, item) => s + (cart[item.id] || 0) * item.price, 0);
  const setQty = (id, qty) => setCart(c => ({ ...c, [id]: Math.max(0, qty) }));

  const cartItems = menu.filter(i => cart[i.id] > 0).map(i => ({
    name: i.name, qty: cart[i.id], price: i.price, emoji: i.emoji
  }));

  if (!tableNum) return <TableSelector onSelect={setTableNum} />;

  if (success) return (
    <div className="client-wrap">
      <div className="success-box">
        <div className="success-icon">✅</div>
        <div className="success-title">Commande & paiement confirmés !</div>
        <p className="success-sub">Votre paiement a été accepté.<br />Votre commande est en cours de préparation.<br />Un serveur vous apportera vos plats sous peu.</p>
        <button className="new-order-btn" onClick={() => { setSuccess(false); setCart({}); setTableNum(null); }}>
          Nouvelle commande
        </button>
      </div>
    </div>
  );

  return (
    <div className="client-wrap">
      <div className="hero">
        <div className="hero-title">🎉 {RESTAURANT}</div>
        <div className="hero-sub">Commandez directement depuis votre table</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span className="table-badge">🪑 Table {tableNum}</span>
      </div>

      {loading ? (
        <div className="empty-state"><div className="pulse">Chargement du menu...</div></div>
      ) : (
        <>
          <div className="category-tabs">
            {categories.map(cat => (
              <button key={cat} className={`cat-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
          <div className="menu-grid">
            {filtered.map(item => (
              <div key={item.id} className="menu-item">
                <div className="item-emoji">{item.emoji}</div>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">{Number(item.price).toFixed(2)} €</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => setQty(item.id, (cart[item.id] || 0) - 1)}>−</button>
                  <span className="qty-num">{cart[item.id] || 0}</span>
                  <button className="qty-btn" onClick={() => setQty(item.id, (cart[item.id] || 0) + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalItems > 0 && (
        <div className="cart-bar" onClick={() => setShowCart(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="cart-count">{totalItems}</div>
            <span style={{ fontWeight: 500 }}>Voir ma commande</span>
          </div>
          <span className="cart-total">{totalPrice.toFixed(2)} €</span>
        </div>
      )}

      {showCart && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCart(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Ma commande — Table {tableNum}</div>
            {cartItems.map((item, i) => (
              <div key={i} className="cart-line">
                <span>{item.emoji} {item.name} × {item.qty}</span>
                <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} €</span>
              </div>
            ))}
            <div className="cart-total-line">
              <span>Total</span>
              <span style={{ color: 'var(--gold)' }}>{totalPrice.toFixed(2)} €</span>
            </div>
            <Elements stripe={stripePromise}>
              <PaymentForm
                totalPrice={totalPrice}
                tableNum={tableNum}
                cartItems={cartItems}
                onSuccess={() => { setSuccess(true); setCart({}); setShowCart(false); }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KITCHEN VIEW ─────────────────────────────────────────────────────────────
function KitchenView() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders')
      .select('*')
      .eq('paid', true)
      .neq('status', 'servi')
      .order('created_at', { ascending: true });
    if (data) setOrders(data);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchOrders();
  };

  const elapsed = (time) => {
    const m = Math.floor((Date.now() - new Date(time)) / 60000);
    return m === 0 ? "À l'instant" : `Il y a ${m} min`;
  };

  const cardClass = { 'en attente': 'attente', 'en préparation': 'preparation', 'prêt': 'pret' };
  const badgeClass = { 'en attente': 'badge-attente', 'en préparation': 'badge-preparation', 'prêt': 'badge-pret' };

  return (
    <div className="kitchen-wrap">
      <div className="view-title">🍳 Écran Cuisine</div>
      <div className="view-sub">{orders.length} commande{orders.length !== 1 ? 's' : ''} payée{orders.length !== 1 ? 's' : ''} en cours</div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍🍳</div>
          <div>Aucune commande en attente</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }} className="pulse">En attente de nouvelles commandes...</div>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order.id} className={`order-card ${cardClass[order.status] || ''}`}>
              <div className="order-top">
                <div>
                  <div className="order-table">Table {order.table_num}</div>
                  <div className="order-id">#{order.id} &nbsp; <span className="paid-badge">✓ Payé</span></div>
                </div>
                <span className={`status-badge ${badgeClass[order.status]}`}>{order.status}</span>
              </div>
              <div className="order-time">⏱ {elapsed(order.created_at)}</div>
              <div className="order-items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-item-line">
                    <span>{item.emoji} {item.name}</span>
                    <span style={{ fontWeight: 700 }}>×{item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="status-btns">
                {order.status === 'en attente' && <button className="status-btn" onClick={() => updateStatus(order.id, 'en préparation')}>👨‍🍳 Préparer</button>}
                {order.status === 'en préparation' && <button className="status-btn done" onClick={() => updateStatus(order.id, 'prêt')}>✅ Prêt</button>}
                {order.status === 'prêt' && <button className="status-btn done" onClick={() => updateStatus(order.id, 'servi')}>🍽 Servi</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Plats', price: '', emoji: '🍽' });
  const appUrl = window.location.origin;

  useEffect(() => {
    supabase.from('menu').select('*').order('category').then(({ data }) => data && setMenu(data));
    supabase.from('orders').select('*').then(({ data }) => data && setOrders(data));
  }, []);

  const totalRevenue = orders.filter(o => o.paid).reduce((s, o) => s + Number(o.total), 0);
  const todayOrders = orders.filter(o => o.paid && new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const pending = orders.filter(o => o.paid && o.status !== 'servi').length;

  const addItem = async () => {
    if (!form.name || !form.price) return;
    const { data } = await supabase.from('menu').insert({ ...form, price: parseFloat(form.price), available: true }).select();
    if (data) { setMenu(m => [...m, data[0]]); setForm({ name: '', category: 'Plats', price: '', emoji: '🍽' }); }
  };

  const delItem = async (id) => {
    await supabase.from('menu').delete().eq('id', id);
    setMenu(m => m.filter(i => i.id !== id));
  };

  const toggleAvail = async (item) => {
    await supabase.from('menu').update({ available: !item.available }).eq('id', item.id);
    setMenu(m => m.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
  };

  return (
    <div className="admin-wrap">
      <div className="view-title">⚙️ Administration</div>
      <div className="view-sub">Gérez votre menu et suivez les commandes</div>
      <div className="admin-grid">
        <div className="stat-card"><div className="stat-num">{todayOrders}</div><div className="stat-label">Commandes aujourd'hui</div></div>
        <div className="stat-card"><div className="stat-num">{pending}</div><div className="stat-label">En cours</div></div>
        <div className="stat-card"><div className="stat-num">{totalRevenue.toFixed(0)} €</div><div className="stat-label">Chiffre d'affaires</div></div>
      </div>

      <div className="section-title">Menu ({menu.length} articles)</div>
      {menu.map(item => (
        <div key={item.id} className="menu-admin-item">
          <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
          <div className="menu-admin-info">
            <div className="menu-admin-name">{item.name}</div>
            <div className="menu-admin-cat">{item.category}</div>
          </div>
          <span className="menu-admin-price">{Number(item.price).toFixed(2)} €</span>
          <button className={`avail-toggle ${item.available ? 'on' : 'off'}`} onClick={() => toggleAvail(item)}>
            {item.available ? '✓ Dispo' : '✗ Indispo'}
          </button>
          <button className="del-btn" onClick={() => delItem(item.id)}>✕</button>
        </div>
      ))}

      <div className="add-item-form">
        <div style={{ fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.9rem' }}>+ Ajouter un plat</div>
        <div className="form-row">
          <div className="form-field"><label>Emoji</label><input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} /></div>
          <div className="form-field"><label>Catégorie</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['Entrées', 'Plats', 'Desserts', 'Boissons'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-field"><label>Nom du plat</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Tiramisu" /></div>
          <div className="form-field"><label>Prix (€)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
        </div>
        <button className="add-btn" onClick={addItem}>Ajouter au menu</button>
      </div>

      <div className="section-title">QR Code unique</div>
      <div className="qr-section">
        <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '0.5rem' }}>
          Un seul QR code pour toutes les tables. Le client choisit son numéro à l'arrivée.
        </p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&bgcolor=ffffff&color=1A1208`}
          alt="QR Code"
          width={200} height={200}
          style={{ display: 'block', margin: '1rem auto', borderRadius: 8 }}
        />
        <div className="qr-url">{appUrl}</div>
        <button className="print-btn" onClick={() => window.print()}>🖨 Imprimer le QR Code</button>
      </div>
    </div>
  );
}

// ─── PIN MODAL ────────────────────────────────────────────────────────────────
const STAFF_PIN = '2010'; // Change ce code ici

function PinModal({ title, onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const check = () => {
    if (pin === STAFF_PIN) { onSuccess(); }
    else { setError(true); setPin(''); setTimeout(() => setError(false), 1000); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
      <div style={{ background:'white', borderRadius:20, padding:'2rem', width:280, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:'1.8rem', marginBottom:'0.5rem' }}>🔒</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.2rem', marginBottom:'1.2rem' }}>{title}</div>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Code PIN"
          maxLength={6}
          autoFocus
          style={{
            width:'100%', padding:'0.75rem', borderRadius:10, textAlign:'center',
            border: error ? '2px solid #8B2020' : '2px solid #E8E0D4',
            fontSize:'1.2rem', letterSpacing:'0.3em', outline:'none',
            background: error ? '#FFF0F0' : '#FAF7F2',
            fontFamily:"'DM Sans', sans-serif", marginBottom:'1rem',
            transition:'border-color 0.2s, background 0.2s'
          }}
        />
        {error && <div style={{ color:'#8B2020', fontSize:'0.82rem', marginBottom:'0.8rem' }}>Code incorrect</div>}
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={onClose} style={{ flex:1, padding:'0.6rem', borderRadius:8, border:'1.5px solid #E8E0D4', background:'white', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontWeight:500 }}>Annuler</button>
          <button onClick={check} style={{ flex:1, padding:'0.6rem', borderRadius:8, border:'none', background:'#C8953A', color:'white', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontWeight:700 }}>Entrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('client');
  const [pinTarget, setPinTarget] = useState(null);

  const requestView = (target) => {
    if (target === 'client') { setView('client'); return; }
    setPinTarget(target);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <span className="nav-title">🎉 {RESTAURANT}</span>
          <button className={`nav-btn ${view === 'client' ? 'active' : ''}`} onClick={() => requestView('client')}>📱 Commander</button>
          <button className={`nav-btn ${view === 'kitchen' ? 'active' : ''}`} onClick={() => requestView('kitchen')}>🍳</button>
          <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => requestView('admin')}>⚙️</button>
        </nav>
        {view === 'client' && <ClientView />}
        {view === 'kitchen' && <KitchenView />}
        {view === 'admin' && <AdminView />}
        {pinTarget && (
          <PinModal
            title={pinTarget === 'kitchen' ? 'Accès Cuisine' : 'Accès Administration'}
            onSuccess={() => { setView(pinTarget); setPinTarget(null); }}
            onClose={() => setPinTarget(null)}
          />
        )}
      </div>
    </>
  );
}
