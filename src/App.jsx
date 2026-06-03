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
function PaymentForm({ totalPrice, tableNum, cartItems, comment, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const tipAmount = customTip !== '' ? parseFloat(customTip) || 0 : tip;
  const grandTotal = totalPrice + tipAmount;

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setError('');
    setPaying(true);
    try {
      const { data: order, error: dbErr } = await supabase
        .from('orders')
        .insert({ table_num: tableNum, items: cartItems, total: totalPrice, tip: tipAmount, comment: comment || '', paid: false, status: 'en attente paiement' })
        .select().single();
      if (dbErr) throw new Error('Erreur base de données');

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(grandTotal * 100), orderId: order.id, tableNum }),
      });
      const { clientSecret, error: apiErr } = await res.json();
      if (apiErr) throw new Error(apiErr);

      const { error: stripeErr } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeErr) throw new Error(stripeErr.message);

      await supabase.from('orders').update({ paid: true, status: 'en attente' }).eq('id', order.id);
      onSuccess(order.id);
    } catch (err) {
      setError(err.message);
    }
    setPaying(false);
  };

  const tipOptions = [0, 1, 2, 5];

  return (
    <div className="payment-section">
      {/* POURBOIRE */}
      <div style={{ marginBottom: '1rem', background: 'var(--cream)', borderRadius: 12, padding: '0.9rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--dark)' }}>
          🙏 Laisser un pourboire ?
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {tipOptions.map(t => (
            <button key={t} onClick={() => { setTip(t); setCustomTip(''); }}
              style={{
                flex: 1, minWidth: 48, padding: '0.45rem 0.3rem', borderRadius: 8, cursor: 'pointer',
                border: tip === t && customTip === '' ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                background: tip === t && customTip === '' ? '#FFF8EE' : 'white',
                fontWeight: 600, fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s'
              }}>
              {t === 0 ? 'Non' : `${t} €`}
            </button>
          ))}
          <input
            type="number" placeholder="Autre €" value={customTip}
            onChange={e => { setCustomTip(e.target.value); setTip(0); }}
            style={{
              flex: 1, minWidth: 64, padding: '0.45rem 0.5rem', borderRadius: 8, textAlign: 'center',
              border: customTip !== '' ? '2px solid var(--gold)' : '1.5px solid var(--border)',
              background: customTip !== '' ? '#FFF8EE' : 'white',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', outline: 'none'
            }}
          />
        </div>
        {tipAmount > 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 500 }}>
            ❤️ Merci ! Pourboire de {tipAmount.toFixed(2)} € ajouté
          </div>
        )}
      </div>

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
        {paying ? '⏳ Traitement...' : `🔒 Payer ${grandTotal.toFixed(2)} €${tipAmount > 0 ? ` (dont ${tipAmount.toFixed(2)} € de pourboire)` : ''}`}
      </button>
      <div className="secure-badge">🔒 Paiement sécurisé par Stripe — vos données sont chiffrées</div>
    </div>
  );
}

// ─── TABLE SELECTOR ───────────────────────────────────────────────────────────
function TableSelector({ onSelect, welcomeMsg }) {
  return (
    <div className="table-select-wrap">
      <img src="/logo.png" alt="Noisy en Fête" style={{ width: '160px', maxWidth: '60vw', margin: '0 auto 1rem', display: 'block' }} />
      {welcomeMsg && (
        <div style={{
          background: 'var(--gold)', color: 'var(--dark)', borderRadius: 12,
          padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem',
          fontWeight: 500, lineHeight: 1.5
        }}>🎉 {welcomeMsg}</div>
      )}
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem" }}>🪑 Votre table</div>
      <p style={{ color: "var(--warm-gray)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Quel est votre numéro de table ?</p>
      <div className="table-grid">
        {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
          <button key={n} className="table-btn" onClick={() => onSelect(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}

// ─── NOTIFICATION HELPER ──────────────────────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// ─── NOTIFICATION BANNER ──────────────────────────────────────────────────────
function NotificationBanner({ onAccept, onDecline }) {
  return (
    <div style={{
      background: 'white', border: '1.5px solid var(--border)', borderRadius: 16,
      padding: '1.2rem', margin: '1rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
        📳 Être notifié quand votre commande est prête ?
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '1rem' }}>
        <span style={{ display: 'block' }}>✅ <strong>Android :</strong> acceptez simplement la notification ci-dessous</span>
        <span style={{ display: 'block', marginTop: '0.3rem' }}>🍎 <strong>iPhone :</strong> ajoutez d&apos;abord ce site à votre écran d&apos;accueil
          <span style={{ display: 'block', paddingLeft: '1.2rem', color: '#aaa' }}>
            Safari → icône partager ⬆️ → "Sur l&apos;écran d&apos;accueil" → revenez ici
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onAccept} style={{
          flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none',
          background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem'
        }}>Oui, m&apos;avertir</button>
        <button onClick={onDecline} style={{
          flex: 1, padding: '0.6rem', borderRadius: 8,
          border: '1.5px solid var(--border)', background: 'white',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem'
        }}>Non merci</button>
      </div>
    </div>
  );
}

// ─── SETTINGS (message accueil + heure fermeture) ────────────────────────────
function useSettings() {
  const [settings, setSettings] = useState({ welcome: '', closing_time: '22:00', closed: false });

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) data.forEach(row => setSettings(s => ({ ...s, [row.key]: row.value })));
    });
    const channel = supabase.channel('settings-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        supabase.from('settings').select('*').then(({ data }) => {
          if (data) {
            const s = {};
            data.forEach(row => s[row.key] = row.value);
            setSettings(prev => ({ ...prev, ...s }));
          }
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return settings;
}

async function saveSetting(key, value) {
  const { error } = await supabase.from('settings').update({ value }).eq('key', key);
  if (error) {
    await supabase.from('settings').insert({ key, value });
  }
}

// ─── CLOSED BANNER ───────────────────────────────────────────────────────────
function ClosedBanner({ closingTime }) {
  return (
    <div style={{
      background: 'var(--dark)', color: 'white', textAlign: 'center',
      padding: '3rem 1.5rem', minHeight: '60vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
        Les commandes sont fermées
      </div>
      <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', maxWidth: 300 }}>
        La prise de commande s&apos;est terminée à {closingTime}.<br />Merci pour votre visite !
      </p>
    </div>
  );
}

// ─── RECEIPT EMAIL FORM ──────────────────────────────────────────────────────
function ReceiptEmailForm({ orderId }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes('@')) return;
    setSending(true);
    await supabase.from('orders').update({ receipt_email: email }).eq('id', orderId);
    setSent(true);
    setSending(false);
  };

  if (sent) return (
    <div style={{ background: '#D4EDDA', borderRadius: 12, padding: '0.8rem 1rem', margin: '1rem 0', fontSize: '0.85rem', color: '#155724' }}>
      ✅ Votre ticket a été enregistré pour {email}
    </div>
  );

  return (
    <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1rem', margin: '1.2rem 0', textAlign: 'left' }}>
      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>🧾 Recevoir votre ticket de caisse ?</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
        Si vous souhaitez votre ticket, ajoutez votre adresse email ci-dessous.
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.com"
          style={{
            flex: 1, padding: '0.55rem 0.75rem', borderRadius: 8,
            border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.88rem', outline: 'none', background: 'var(--cream)'
          }}
        />
        <button onClick={handleSend} disabled={sending || !email}
          style={{
            padding: '0.55rem 1rem', borderRadius: 8, border: 'none',
            background: 'var(--dark)', color: 'white', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
            opacity: !email ? 0.5 : 1
          }}>
          {sending ? '⏳' : 'Envoyer'}
        </button>
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
  const [orderId, setOrderId] = useState(null);
  const [notifState, setNotifState] = useState('ask');
  const [notified, setNotified] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedExtras, setSelectedExtras] = useState({});
  const settings = useSettings();

  // Vérifier si les commandes sont fermées
  const isClosed = (() => {
    if (settings.closed === 'true') return true;
    if (settings.closed === 'false') return false; // forcé ouvert par l'admin
    const now = new Date();
    const [h, m] = (settings.closing_time || '22:00').split(':').map(Number);
    const closing = new Date(); closing.setHours(h, m, 0, 0);
    return now >= closing;
  })();

  useEffect(() => {
    supabase.from('menu').select('*').eq('available', true).order('category').then(({ data }) => {
      if (data) setMenu(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!orderId || notifState !== 'accepted') return;
    const channel = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        if (payload.new.status === 'prêt' && !notified) {
          sendNotification('🎉 Votre commande est prête !', 'Rendez-vous au comptoir pour la récupérer.');
          setNotified(true);
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [orderId, notifState, notified]);

  const handleAcceptNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifState(granted ? 'accepted' : 'declined');
  };

  const categories = ['Tous', ...new Set(menu.map(i => i.category))];
  const filtered = activeCategory === 'Tous' ? menu : menu.filter(i => i.category === activeCategory);
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const basePrice = menu.reduce((s, item) => s + (cart[item.id] || 0) * item.price, 0);
  const setQty = (id, qty) => setCart(c => ({ ...c, [id]: Math.max(0, qty) }));
  const extrasTotal = Object.entries(selectedExtras).reduce((sum, [id, exs]) => {
    const qty = cart[parseInt(id)] || 0;
    return sum + qty * exs.reduce((s, e) => s + Number(e.price), 0);
  }, 0);
  const cartItems = (() => {
    const items = menu.filter(i => cart[i.id] > 0).map(i => ({
      name: i.name, qty: cart[i.id], price: i.price, emoji: i.emoji,
      extras: selectedExtras[i.id] || [], free: 0
    }));
    // Appliquer la fidélité
    const ls = settings;
    if (ls.loyalty_active === 'true' && ls.loyalty_item && ls.loyalty_every) {
      const every = parseInt(ls.loyalty_every);
      items.forEach(item => {
        if (item.name === ls.loyalty_item && item.qty >= every) {
          item.free = Math.floor(item.qty / every);
        }
      });
    }
    return items;
  })();

  const loyaltyDiscount = cartItems.reduce((s, i) => s + i.free * i.price, 0);
  const totalPrice = basePrice + extrasTotal - loyaltyDiscount;

  if (isClosed) return <ClosedBanner closingTime={settings.closing_time || '22:00'} />;
  if (!tableNum) return <TableSelector onSelect={setTableNum} welcomeMsg={settings.welcome} />;

  if (success) return (
    <div className="client-wrap">
      <div className="success-box">
        <div className="success-icon">✅</div>
        <div className="success-title">Commande & paiement confirmés !</div>
        <p className="success-sub">
          Votre paiement a été accepté.<br />
          Votre commande est en cours de préparation.
          {notifState === 'accepted'
            ? <><br /><strong>📳 Vous serez notifié dès qu'elle sera prête !</strong></>
            : <><br />Un serveur vous apportera vos plats sous peu.</>
          }
        </p>
        <ReceiptEmailForm orderId={orderId} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', marginTop: '1.5rem' }}>
          <button className="new-order-btn" style={{ background: 'var(--gold)', width: '100%', maxWidth: 280 }}
            onClick={() => { setSuccess(false); setCart({}); }}>
            ➕ Commander autre chose (Table {tableNum})
          </button>
          <button className="new-order-btn" style={{ background: 'white', color: 'var(--dark)', border: '1.5px solid var(--border)', width: '100%', maxWidth: 280 }}
            onClick={() => { setSuccess(false); setCart({}); setTableNum(null); setOrderId(null); setNotifState('ask'); setNotified(false); }}>
            🔄 Nouvelle table
          </button>
        </div>
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

      {notifState === 'ask' && (
        <NotificationBanner onAccept={handleAcceptNotif} onDecline={() => setNotifState('declined')} />
      )}
      {notifState === 'accepted' && (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--green)', marginBottom: '0.5rem' }}>
          📳 Notifications activées — vous serez alerté quand votre commande est prête
        </div>
      )}

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
              <div key={item.id} className="menu-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="item-emoji">{item.emoji}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{Number(item.price).toFixed(2)} €</div>
                    {settings.loyalty_active === 'true' && settings.loyalty_item && item.name && settings.loyalty_item.trim() === item.name.trim() && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        marginTop: '0.3rem', background: '#FFF8EE',
                        border: '1px solid var(--gold)', borderRadius: 6,
                        padding: '0.2rem 0.5rem', fontSize: '0.72rem',
                        color: 'var(--gold)', fontWeight: 600
                      }}>
                        🎁 1 offerte toutes les {settings.loyalty_every || '4'} achetées
                      </div>
                    )}
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => setQty(item.id, (cart[item.id] || 0) - 1)}>−</button>
                    <span className="qty-num">{cart[item.id] || 0}</span>
                    <button className="qty-btn" onClick={() => setQty(item.id, (cart[item.id] || 0) + 1)}>+</button>
                  </div>
                </div>
                {cart[item.id] > 0 && item.extras && item.extras.length > 0 && (
                  <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginBottom: '0.3rem' }}>Suppléments :</div>
                    {item.extras.map((ex, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', cursor: 'pointer' }}>
                        <input type="checkbox"
                          checked={!!(selectedExtras[item.id] || []).find(e => e.name === ex.name)}
                          onChange={e => {
                            const cur = selectedExtras[item.id] || [];
                            setSelectedExtras(prev => ({
                              ...prev,
                              [item.id]: e.target.checked ? [...cur, ex] : cur.filter(x => x.name !== ex.name)
                            }));
                          }}
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        <span style={{ fontSize: '0.82rem' }}>{ex.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600 }}>+{Number(ex.price).toFixed(2)} €</span>
                      </label>
                    ))}
                  </div>
                )}
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
              <div key={i}>
                <div className="cart-line">
                  <span>{item.emoji} {item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} €</span>
                </div>
                {item.extras && item.extras.map((ex, j) => (
                  <div key={j} className="cart-line" style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--warm-gray)' }}>
                    <span>↳ {ex.name} × {item.qty}</span>
                    <span>+{(Number(ex.price) * item.qty).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            ))}
            {loyaltyDiscount > 0 && (
              <div className="cart-line" style={{ color: 'var(--green)', fontWeight: 600 }}>
                <span>🎁 {cartItems.find(i => i.free > 0)?.free}× {settings.loyalty_item} offert(s) !</span>
                <span>-{loyaltyDiscount.toFixed(2)} €</span>
              </div>
            )}
            <div className="cart-total-line">
              <span>Total</span>
              <span style={{ color: 'var(--gold)' }}>{totalPrice.toFixed(2)} €</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--warm-gray)', marginBottom: '0.4rem' }}>
                💬 Commentaire / demande spéciale
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ex: sans oignons, sans frites, allergie aux noix..."
                rows={2}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8,
                  border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', outline: 'none', background: 'var(--cream)',
                  resize: 'none', lineHeight: 1.5
                }}
              />
            </div>
            <Elements stripe={stripePromise}>
              <PaymentForm
                totalPrice={totalPrice}
                tableNum={tableNum}
                cartItems={cartItems}
                comment={comment}
                onSuccess={(id) => { setOrderId(id); setSuccess(true); setCart({}); setShowCart(false); setComment(''); }}
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useCallback((n) => { prevCountRef.current = n; }, []);
  const orderCountRef = useState(0);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch(e) {}
  };

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders')
      .select('*').eq('paid', true).neq('status', 'servi')
      .order('created_at', { ascending: true });
    if (data) {
      const newCount = data.filter(o => o.status === 'en attente').length;
      if (soundEnabled && newCount > orderCountRef[0]) playBeep();
      orderCountRef[0] = newCount;
      setOrders(data);
    }
  }, [soundEnabled]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <div className="view-title">🍳 Écran Cuisine</div>
        <button onClick={() => { setSoundEnabled(s => !s); }} style={{
          padding: '0.4rem 0.9rem', borderRadius: 100, border: '1.5px solid var(--border)',
          background: soundEnabled ? '#D4EDDA' : 'white', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600,
          color: soundEnabled ? '#155724' : 'var(--warm-gray)'
        }}>
          {soundEnabled ? '🔔 Son activé' : '🔕 Son désactivé'}
        </button>
      </div>
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
              {order.comment && (
                <div style={{ background: '#FFF8EE', border: '1px solid var(--gold)', borderRadius: 8, padding: '0.4rem 0.7rem', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--dark)' }}>
                  💬 {order.comment}
                </div>
              )}
              {order.items.some(i => i.free > 0) && (
                <div style={{ background: '#D4EDDA', border: '1px solid #C3E6CB', borderRadius: 8, padding: '0.4rem 0.7rem', marginBottom: '0.6rem', fontSize: '0.82rem', color: '#155724', fontWeight: 600 }}>
                  🎁 {order.items.filter(i => i.free > 0).map(i => `${i.free}× ${i.name} OFFERT`).join(', ')}
                </div>
              )}
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

// ─── CONFIG TAB ──────────────────────────────────────────────────────────────
function ConfigTab() {
  const settings = useSettings();
  const [welcome, setWelcome] = useState('');
  const [closingTime, setClosingTime] = useState('22:00');
  const [loyaltyItem, setLoyaltyItem] = useState('');
  const [loyaltyEvery, setLoyaltyEvery] = useState('4');
  const [loyaltyActive, setLoyaltyActive] = useState(false);
  const [loyaltyMenu, setLoyaltyMenu] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWelcome(settings.welcome || '');
    setClosingTime(settings.closing_time || '22:00');
    setLoyaltyItem(settings.loyalty_item || '');
    setLoyaltyEvery(settings.loyalty_every || '4');
    setLoyaltyActive(settings.loyalty_active === 'true');
    supabase.from('menu').select('id,name,emoji,price').order('category').then(({ data }) => data && setLoyaltyMenu(data));
  }, [settings.welcome, settings.closing_time, settings.loyalty_item, settings.loyalty_every, settings.loyalty_active]);

  const isClosed = settings.closed === 'true';

  const save = async () => {
    await saveSetting('welcome', welcome);
    await saveSetting('closing_time', closingTime);
    await saveSetting('loyalty_item', loyaltyItem);
    await saveSetting('loyalty_every', loyaltyEvery);
    await saveSetting('loyalty_active', loyaltyActive ? 'true' : 'false');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="section-title">🛠 Configuration de la soirée</div>

      {/* Statut ouvert/fermé */}
      <div style={{ background: isClosed ? '#FFF5F5' : '#F0FFF4', border: `2px solid ${isClosed ? '#F5C6CB' : '#C3E6CB'}`, borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: isClosed ? 'var(--red)' : 'var(--green)', marginBottom: '0.3rem' }}>
          {isClosed ? '🔒 Commandes fermées' : '✅ Commandes ouvertes'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.9rem' }}>
          {isClosed
            ? 'Les clients ne peuvent plus passer de commande.'
            : 'Les clients peuvent commander normalement.'}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => saveSetting('closed', 'false')} style={{
            flex: 1, minWidth: 140, padding: '0.7rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            background: 'var(--green)', color: 'white',
            opacity: !isClosed ? 0.5 : 1
          }}>🟢 Forcer l&apos;ouverture</button>
          <button onClick={() => saveSetting('closed', 'true')} style={{
            flex: 1, minWidth: 140, padding: '0.7rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            background: 'var(--red)', color: 'white',
            opacity: isClosed ? 0.5 : 1
          }}>🔴 Fermer maintenant</button>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--warm-gray)', marginTop: '0.6rem' }}>
          💡 &quot;Forcer l&apos;ouverture&quot; ignore l&apos;heure de fermeture automatique
        </div>
      </div>

      {/* Heure de fermeture automatique */}
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>🕙 Heure de fermeture automatique</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
          Les commandes se ferment automatiquement à cette heure sur toutes les pages. Par défaut : 22h00.
        </div>
        <input
          type="time" value={closingTime}
          onChange={e => setClosingTime(e.target.value)}
          style={{
            padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', outline: 'none',
            background: 'var(--cream)', fontWeight: 600
          }}
        />
      </div>

      {/* Message d'accueil */}
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>🎉 Message d&apos;accueil</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
          Affiché aux clients sur la page de sélection de table. Laissez vide pour ne rien afficher.
        </div>
        <textarea
          value={welcome}
          onChange={e => setWelcome(e.target.value)}
          placeholder="Ex: Bienvenue à la soirée du 14 juillet ! Bonne dégustation 🎆"
          rows={3}
          style={{
            width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8,
            border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.88rem', outline: 'none', background: 'var(--cream)',
            resize: 'vertical', lineHeight: 1.5
          }}
        />
      </div>

      {/* Fidélité */}
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>🎁 Offre fidélité</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
          Choisissez un produit et définissez à partir de combien d&apos;achats le suivant est offert.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div className="form-field">
            <label>Produit concerné</label>
            <select value={loyaltyItem} onChange={e => setLoyaltyItem(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', background: 'var(--cream)', outline: 'none' }}>
              <option value="">-- Aucun --</option>
              {loyaltyMenu.map(item => (
                <option key={item.id} value={item.name}>{item.emoji} {item.name} ({Number(item.price).toFixed(2)} €)</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Offert tous les combien d&apos;achats ?</label>
            <input type="number" min="2" max="20" value={loyaltyEvery}
              onChange={e => setLoyaltyEvery(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', background: 'var(--cream)', outline: 'none', maxWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" id="loyaltyActive" checked={loyaltyActive} onChange={e => setLoyaltyActive(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            <label htmlFor="loyaltyActive" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Activer cette offre</label>
          </div>
        </div>
        {loyaltyItem && loyaltyEvery && loyaltyActive && (
          <div style={{ background: '#FFF8EE', border: '1px solid var(--gold)', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: 'var(--dark)' }}>
            🎁 1 {loyaltyItem} offert toutes les {loyaltyEvery} achetées
          </div>
        )}
      </div>

      <button onClick={save} style={{
        padding: '0.75rem 2rem', background: saved ? 'var(--green)' : 'var(--dark)',
        color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
        fontWeight: 700, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
        transition: 'background 0.3s'
      }}>
        {saved ? '✅ Enregistré !' : '💾 Enregistrer les paramètres'}
      </button>
    </div>
  );
}

// ─── ARCHIVES TAB ────────────────────────────────────────────────────────────
function ArchivesTab() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('orders').select('*').eq('paid', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAllOrders(data); setLoading(false); });
  }, []);

  // Grouper par soirée (par date)
  const byDate = {};
  allOrders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(o);
  });

  const dates = Object.keys(byDate);

  if (loading) return <div className="empty-state"><div className="pulse">Chargement...</div></div>;
  if (dates.length === 0) return <div className="empty-state"><div className="empty-icon">🗄</div><div>Aucun historique disponible</div></div>;

  return (
    <div>
      <div className="section-title">Historique des soirées ({dates.length})</div>
      {dates.map(date => {
        const orders = byDate[date];
        const total = orders.reduce((s, o) => s + Number(o.total), 0);
        const tips = orders.reduce((s, o) => s + Number(o.tip || 0), 0);
        const items = {};
        orders.forEach(o => o.items.forEach(it => {
          if (!items[it.name]) items[it.name] = { emoji: it.emoji, qty: 0 };
          items[it.name].qty += it.qty;
        }));
        const topItems = Object.entries(items).sort((a,b) => b[1].qty - a[1].qty).slice(0, 3);

        return (
          <div key={date} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', textTransform: 'capitalize' }}>{date}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginTop: '0.2rem' }}>{orders.length} commandes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>{total.toFixed(2)} €</div>
                {tips > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>dont {tips.toFixed(2)} € pourboires</div>}
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)' }}>
              🏆 Top : {topItems.map(([name, d]) => `${d.emoji} ${name} ×${d.qty}`).join(' · ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Plats', price: '', emoji: '🍽' });
  const [activeTab, setActiveTab] = useState('menu');
  const [resetting, setResetting] = useState(false);
  const appUrl = window.location.origin;

  const loadOrders = () => supabase.from('orders').select('*').then(({ data }) => data && setOrders(data));

  useEffect(() => {
    supabase.from('menu').select('*').order('category').then(({ data }) => data && setMenu(data));
    loadOrders();
  }, []);

  const paidOrders = orders.filter(o => o.paid);
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const todayOrders = paidOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const pending = paidOrders.filter(o => o.status !== 'servi').length;

  const salesByItem = {};
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      if (!salesByItem[item.name]) salesByItem[item.name] = { name: item.name, emoji: item.emoji, qty: 0, revenue: 0 };
      salesByItem[item.name].qty += item.qty;
      salesByItem[item.name].revenue += item.qty * item.price;
    });
  });
  const salesList = Object.values(salesByItem).sort((a, b) => b.qty - a.qty);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const updateStock = async (item, newStock) => {
    if (newStock === null) {
      await supabase.from('menu').update({ stock: null, available: true }).eq('id', item.id);
      setMenu(m => m.map(i => i.id === item.id ? { ...i, stock: null, available: true } : i));
    } else {
      const stock = Math.max(0, newStock);
      await supabase.from('menu').update({ stock, available: stock > 0 }).eq('id', item.id);
      setMenu(m => m.map(i => i.id === item.id ? { ...i, stock, available: stock > 0 } : i));
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, price: item.price, emoji: item.emoji, category: item.category });
  };

  const saveEdit = async (id) => {
    if (!editForm.name || !editForm.price) return;
    await supabase.from('menu').update({
      name: editForm.name, price: parseFloat(editForm.price),
      emoji: editForm.emoji, category: editForm.category,
      extras: editForm.extras || []
    }).eq('id', id);
    setMenu(m => m.map(i => i.id === id ? { ...i, ...editForm, price: parseFloat(editForm.price) } : i));
    setEditingId(null);
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ Supprimer TOUTES les commandes de la soirée ? Cette action est irréversible.')) return;
    setResetting(true);
    await supabase.from('orders').delete().neq('id', 0);
    setOrders([]);
    setResetting(false);
    setActiveTab('menu');
    alert('✅ Remise à zéro effectuée ! Prêt pour la prochaine soirée.');
  };

  const tabStyle = (tab) => ({
    padding: '0.5rem 1.2rem', borderRadius: 100, border: '1.5px solid var(--border)',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem',
    background: activeTab === tab ? 'var(--dark)' : 'white',
    color: activeTab === tab ? 'white' : 'var(--dark)',
    transition: 'all 0.2s'
  });

  return (
    <div className="admin-wrap">
      <div className="view-title">⚙️ Administration</div>
      <div className="view-sub">Gérez votre restaurant</div>

      <div className="admin-grid">
        <div className="stat-card"><div className="stat-num">{todayOrders}</div><div className="stat-label">Commandes du soir</div></div>
        <div className="stat-card"><div className="stat-num">{pending}</div><div className="stat-label">En cours</div></div>
        <div className="stat-card"><div className="stat-num">{totalRevenue.toFixed(0)} €</div><div className="stat-label">CA total</div></div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 1rem', flexWrap: 'wrap' }}>
        <button style={tabStyle('menu')} onClick={() => setActiveTab('menu')}>🍽 Menu</button>
        <button style={tabStyle('historique')} onClick={() => setActiveTab('historique')}>📊 Historique</button>
        <button style={tabStyle('qr')} onClick={() => setActiveTab('qr')}>📱 QR Code</button>
        <button style={tabStyle('archives')} onClick={() => setActiveTab('archives')}>🗄 Archives</button>
        <button style={tabStyle('config')} onClick={() => setActiveTab('config')}>🛠 Config</button>
      </div>

      {/* TAB MENU */}
      {activeTab === 'menu' && <>
        <div className="section-title">Menu ({menu.length} articles)</div>
        {menu.map(item => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div style={{ background: '#FFFBF0', border: '2px solid var(--gold)', borderRadius: 12, padding: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--gold)' }}>✏️ Modifier "{item.name}"</div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Emoji</label>
                    <input value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} style={{ fontSize: '1.2rem' }} />
                  </div>
                  <div className="form-field">
                    <label>Catégorie</label>
                    <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                      {['Entrées', 'Plats', 'Desserts', 'Boissons'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Nom du plat</label>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Prix (€)</label>
                    <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
                {/* Suppléments */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--warm-gray)', marginBottom: '0.4rem' }}>➕ Suppléments disponibles</div>
                  {(editForm.extras || []).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                      <input value={ex.name} onChange={e => {
                        const extras = [...(editForm.extras||[])]; extras[i] = {...extras[i], name: e.target.value};
                        setEditForm(f => ({...f, extras}));
                      }} placeholder="Ex: Chantilly" style={{ flex: 2, padding: '0.4rem 0.6rem', borderRadius: 6, border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', outline: 'none', background: 'var(--cream)' }} />
                      <input type="number" value={ex.price} onChange={e => {
                        const extras = [...(editForm.extras||[])]; extras[i] = {...extras[i], price: e.target.value};
                        setEditForm(f => ({...f, extras}));
                      }} placeholder="0.50" style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6, border: '1.5px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', outline: 'none', background: 'var(--cream)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>€</span>
                      <button onClick={() => setEditForm(f => ({...f, extras: f.extras.filter((_,j) => j!==i)}))}
                        style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--red)', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setEditForm(f => ({...f, extras: [...(f.extras||[]), {name:'', price:''}]}))}
                    style={{ padding: '0.3rem 0.8rem', background: 'var(--cream)', border: '1.5px dashed var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", color: 'var(--dark)' }}>
                    + Ajouter un supplément
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => saveEdit(item.id)} style={{ padding: '0.5rem 1.2rem', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>✅ Enregistrer</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: '0.5rem 1rem', background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="menu-admin-item">
                <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                <div className="menu-admin-info">
                  <div className="menu-admin-name">{item.name}</div>
                  <div className="menu-admin-cat">{item.category}</div>
                </div>
                <span className="menu-admin-price">{Number(item.price).toFixed(2)} €</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--cream)', borderRadius: 8, padding: '0.2rem 0.4rem', border: '1.5px solid var(--border)' }}>
                  <button
                    onClick={() => {
                      if (item.stock === null || item.stock === undefined) return;
                      if (item.stock <= 0) updateStock(item, null);
                      else updateStock(item, item.stock - 1);
                    }}
                    title="Réduire le stock (à 0 = illimité)"
                    style={{ width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'var(--dark)' }}>−</button>
                  <span
                    style={{ minWidth: 28, textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: item.stock === null || item.stock === undefined ? 'var(--green)' : 'var(--dark)' }}
                    title="Cliquer pour basculer illimité/limité"
                    onClick={() => updateStock(item, item.stock === null || item.stock === undefined ? 10 : null)}
                  >
                    {item.stock === null || item.stock === undefined ? '∞' : item.stock}
                  </span>
                  <button onClick={() => updateStock(item, (item.stock ?? 0) + 1)} style={{ width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'var(--dark)' }}>+</button>
                </div>
                <button className={`avail-toggle ${item.available ? 'on' : 'off'}`} onClick={() => toggleAvail(item)}>
                  {item.available ? '✓ Dispo' : '✗ Indispo'}
                </button>
                <button onClick={() => startEdit(item)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--blue)', transition: 'all 0.2s' }}>✏️</button>
                <button className="del-btn" onClick={() => delItem(item.id)}>✕</button>
              </div>
            )}
          </div>
        ))}
        <div className="add-item-form">
          <div style={{ fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.9rem' }}>+ Ajouter un plat</div>

          {/* Sélecteur d'emoji par catégorie */}
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>Choisir un emoji</label>
            {[
              { label: '🥗 Entrées', emojis: ['🥗','🍲','🧅','🫕','🥚','🧀','🍱','🥙','🫙','🥣','🐟','🦐','🥓','🫛','🍄','🥕','🧆','🫔'] },
              { label: '🍽 Plats', emojis: ['🥩','🍗','🍖','🌮','🍝','🍜','🍛','🥘','🫚','🐓','🦞','🦑','🥞','🌯','🍔','🌭','🍕','🥫','🍚','🫓'] },
              { label: '🍮 Desserts', emojis: ['🍮','🍫','🧁','🎂','🍰','🍩','🍪','🥧','🍨','🍦','🍬','🍭','🍯','🫐','🍓','🍒','🍑','🥝'] },
              { label: '🍷 Boissons', emojis: ['🍷','🍺','🍻','🥂','🍾','🍸','🍹','🧉','☕','🍵','🧃','🥤','💧','🫖','🧊','🍶'] },
              { label: '➕ Autres', emojis: ['🎉','⭐','🔥','✨','💯','🏆','👌','😋','🤤','❤️','🌿','🫶','🎊','🪄','💎','🌟'] },
            ].map(group => (
              <div key={group.label} style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--warm-gray)', marginBottom: '0.3rem' }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {group.emojis.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      style={{
                        width: 36, height: 36, fontSize: '1.2rem', borderRadius: 8, cursor: 'pointer',
                        border: form.emoji === e ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                        background: form.emoji === e ? '#FFF8EE' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                    >{e}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--cream)', borderRadius: 8, border: '1.5px solid var(--border)' }}>
            <span style={{ fontSize: '1.4rem' }}>{form.emoji}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--warm-gray)' }}>Emoji sélectionné</span>
          </div>

          <div className="form-row">
            <div className="form-field"><label>Catégorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['Entrées', 'Plats', 'Desserts', 'Boissons'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Prix (€)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
          </div>
          <div className="form-field" style={{ marginBottom: '0.75rem' }}>
            <label>Nom du plat</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Tiramisu" />
          </div>
          <button className="add-btn" onClick={addItem}>Ajouter au menu</button>
        </div>
      </>}

      {/* TAB HISTORIQUE */}
      {activeTab === 'historique' && <>
        <div className="section-title">Ventes de la soirée</div>
        {salesList.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><div>Aucune vente pour le moment</div></div>
        ) : <>
          {salesList.map((item, i) => (
            <div key={i} className="menu-admin-item">
              <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
              <div className="menu-admin-info">
                <div className="menu-admin-name">{item.name}</div>
                <div className="menu-admin-cat">{item.qty} vendus</div>
              </div>
              <span className="menu-admin-price">{item.revenue.toFixed(2)} €</span>
            </div>
          ))}
          {/* Récap financier */}
          <div style={{ background: 'var(--dark)', color: 'white', borderRadius: 12, padding: '1rem 1.2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>Total commandes</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--gold)' }}>{totalRevenue.toFixed(2)} €</span>
            </div>
            {(() => { const tips = paidOrders.reduce((s,o) => s + Number(o.tip||0), 0); return tips > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
                <span style={{ color: '#aaa', fontSize: '0.88rem' }}>dont pourboires</span>
                <span style={{ color: '#C8953A', fontWeight: 600 }}>+{tips.toFixed(2)} €</span>
              </div>
            );})()}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>Total encaissé</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--gold)' }}>
                {(totalRevenue + paidOrders.reduce((s,o) => s + Number(o.tip||0), 0)).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Rapport de fin de soirée */}
          {paidOrders.length > 0 && (() => {
            const tips = paidOrders.reduce((s,o) => s + Number(o.tip||0), 0);
            const times = paidOrders.map(o => new Date(o.created_at));
            const start = new Date(Math.min(...times)).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            const end = new Date(Math.max(...times)).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            const topTable = Object.entries(paidOrders.reduce((acc, o) => {
              acc[o.table_num] = (acc[o.table_num] || 0) + Number(o.total);
              return acc;
            }, {})).sort((a,b) => b[1]-a[1])[0];
            const topItem = salesList[0];
            return (
              <div style={{ background: '#F0F7FF', border: '1.5px solid #BDD0F5', borderRadius: 14, padding: '1.2rem', marginTop: '1rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.8rem', color: 'var(--blue)', fontSize: '0.95rem' }}>📋 Rapport de soirée</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    ['🕐 Première commande', start],
                    ['🕐 Dernière commande', end],
                    ['🪑 Table top dépense', `Table ${topTable?.[0]} (${Number(topTable?.[1]||0).toFixed(2)} €)`],
                    ['🏆 Plat le + vendu', topItem ? `${topItem.emoji} ${topItem.name} ×${topItem.qty}` : '-'],
                    ['🧾 Nb commandes', paidOrders.length],
                    ['🙏 Pourboires', `${tips.toFixed(2)} €`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'white', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.2rem' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="section-title" style={{ marginTop: '1.5rem' }}>Détail des commandes ({paidOrders.length})</div>
          {paidOrders.slice().reverse().map(order => (
            <div key={order.id} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600 }}>Table {order.table_num} — #{order.id}</span>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{Number(order.total).toFixed(2)} €</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>
                {order.items.map((it, i) => `${it.emoji} ${it.name} ×${it.qty}`).join(' · ')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#ccc', marginTop: '0.3rem' }}>
                {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {order.status}
              </div>
            </div>
          ))}

          {/* Export Excel */}
          <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: '#EEF4FF', border: '1.5px solid #BDD0F5', borderRadius: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--blue)' }}>📥 Export Excel</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>
              Télécharger toutes les commandes de la soirée en fichier Excel.
            </p>
            <button onClick={() => {
              const rows = [['#', 'Table', 'Heure', 'Articles', 'Total €', 'Pourboire €', 'Statut']];
              paidOrders.forEach(o => {
                rows.push([
                  o.id,
                  o.table_num,
                  new Date(o.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  o.items.map(i => `${i.name} x${i.qty}`).join(' | '),
                  Number(o.total).toFixed(2),
                  Number(o.tip || 0).toFixed(2),
                  o.status
                ]);
              });
              const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
              const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `noisy-en-fete-${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} style={{ padding: '0.6rem 1.2rem', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              📥 Télécharger le fichier Excel
            </button>
          </div>

          <div style={{ marginTop: '1rem', padding: '1.2rem', background: '#FFF5F5', border: '1.5px solid #F5C6CB', borderRadius: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--red)' }}>🔄 Remise à zéro</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--warm-gray)', marginBottom: '1rem' }}>
              Efface toutes les commandes de la soirée. À faire en fin de service, avant la prochaine soirée.
            </p>
            <button onClick={handleReset} disabled={resetting} style={{
              padding: '0.7rem 1.5rem', background: 'var(--red)', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", opacity: resetting ? 0.6 : 1
            }}>
              {resetting ? '⏳ Remise à zéro...' : '🗑 Effacer toutes les commandes'}
            </button>
          </div>
        </>}
      </>}


      {/* TAB CONFIG */}
      {activeTab === 'config' && <ConfigTab />}
      {/* TAB ARCHIVES */}
      {activeTab === 'archives' && <ArchivesTab />}

      {/* TAB QR */}
      {activeTab === 'qr' && <>
        <div className="section-title">QR Code unique</div>
        <div className="qr-section">
          <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '0.5rem' }}>
            Un seul QR code pour toutes les tables. Le client choisit son numéro à l'arrivée.
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&bgcolor=ffffff&color=1A1208`}
            alt="QR Code" width={200} height={200}
            style={{ display: 'block', margin: '1rem auto', borderRadius: 8 }}
          />
          <div className="qr-url">{appUrl}</div>
          <button className="print-btn" onClick={() => window.print()}>🖨 Imprimer le QR Code</button>
        </div>
      </>}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '2rem', width: 280, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔒</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '1.2rem' }}>{title}</div>
        <input
          type="password" value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Code PIN" maxLength={6} autoFocus
          style={{
            width: '100%', padding: '0.75rem', borderRadius: 10, textAlign: 'center',
            border: error ? '2px solid #8B2020' : '2px solid #E8E0D4',
            fontSize: '1.2rem', letterSpacing: '0.3em', outline: 'none',
            background: error ? '#FFF0F0' : '#FAF7F2',
            fontFamily: "'DM Sans', sans-serif", marginBottom: '1rem',
            transition: 'border-color 0.2s, background 0.2s'
          }}
        />
        {error && <div style={{ color: '#8B2020', fontSize: '0.82rem', marginBottom: '0.8rem' }}>Code incorrect</div>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1.5px solid #E8E0D4', background: 'white', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Annuler</button>
          <button onClick={check} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none', background: '#C8953A', color: 'white', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Entrer</button>
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
        <footer style={{
          textAlign: 'center', padding: '1.5rem', fontSize: '0.75rem',
          color: 'var(--warm-gray)', borderTop: '1px solid var(--border)',
          marginTop: '2rem'
        }}>
          <a href="https://noisyenfete.fr" target="_blank" rel="noreferrer"
            style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
            🎉 noisyenfete.fr
          </a>
        </footer>
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
