import os
import asyncio
import logging
from typing import Optional

import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
OWNER = os.environ.get("OWNER_EMAIL", "")

log = logging.getLogger("email_service")


async def send_email(to: str, subject: str, html: str) -> Optional[str]:
    if not resend.api_key:
        log.warning("RESEND_API_KEY not set; skipping email to %s", to)
        return None
    params = {
        "from": SENDER,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        res = await asyncio.to_thread(resend.Emails.send, params)
        return res.get("id") if isinstance(res, dict) else None
    except Exception as e:
        log.error("Email send failed to %s: %s", to, e)
        return None


def _wrap(inner_html: str) -> str:
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#0D0D0D;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 20px;font-family:Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #222222;max-width:560px;">
      <tr><td style="padding:32px;">
        <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:6px;text-align:center;">KNITCULT</div>
        <div style="height:1px;background:#222222;margin:24px 0;"></div>
        {inner_html}
        <div style="height:1px;background:#222222;margin:28px 0 20px;"></div>
        <div style="color:#52525b;font-size:11px;font-family:monospace;letter-spacing:1px;text-align:center;">KNITCULT — COLLECTOR GRADE SOCCER JERSEYS</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def otp_email_html(code: str, minutes: int = 10) -> str:
    inner = f"""
    <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:2px;text-align:center;">Your verification code</div>
    <div style="color:#ffffff;font-size:44px;font-weight:900;letter-spacing:14px;margin:22px 0;font-family:'Courier New',monospace;text-align:center;">{code}</div>
    <div style="color:#a1a1aa;font-size:13px;text-align:center;">Valid for {minutes} minutes. Enter this on the KnitCult checkout page to verify your email.</div>
    <div style="color:#52525b;font-size:11px;margin-top:22px;text-align:center;">If you didn't request this, safely ignore this email.</div>
    """
    return _wrap(inner)


def order_customer_html(order) -> str:
    rows = "".join([
        f"<tr>"
        f"<td style='padding:10px 0;color:#e5e5e5;font-size:13px;'>{item.product_name}<br>"
        f"<span style='color:#71717a;font-size:11px;font-family:monospace;'>SIZE {item.size} × {item.qty}</span></td>"
        f"<td style='padding:10px 0;color:#ffffff;text-align:right;font-family:monospace;font-size:13px;'>${item.price_at_purchase * item.qty:.2f}</td>"
        f"</tr>"
        for item in order.items
    ])
    addr = order.shipping_address or {}
    addr_str = f"{addr.get('name', '')}<br>{addr.get('line1', '')}<br>{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}<br>{addr.get('country', '')}"
    inner = f"""
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">Order confirmed</h2>
    <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;">Tracking ID: <strong style="color:#ffffff;font-family:monospace;">{order.tracking_id}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      {rows}
      <tr><td colspan="2" style="border-top:1px solid #222222;padding-top:14px;">
        <table width="100%"><tr>
          <td style="color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Subtotal</td>
          <td style="text-align:right;color:#a1a1aa;font-family:monospace;font-size:13px;">${order.subtotal:.2f}</td>
        </tr>{'<tr><td style="color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-top:6px;">Discount</td><td style="text-align:right;color:#a1a1aa;font-family:monospace;font-size:13px;padding-top:6px;">-$' + f'{order.discount:.2f}' + '</td></tr>' if order.discount > 0 else ''}
        <tr>
          <td style="color:#ffffff;font-weight:bold;font-size:14px;padding-top:10px;text-transform:uppercase;letter-spacing:1px;">Total</td>
          <td style="text-align:right;color:#ffffff;font-family:monospace;font-weight:bold;font-size:16px;padding-top:10px;">${order.total:.2f}</td>
        </tr></table>
      </td></tr>
    </table>
    <div style="height:1px;background:#222222;margin:22px 0;"></div>
    <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Ship to</div>
    <div style="color:#e5e5e5;font-size:13px;margin-top:8px;line-height:1.5;">{addr_str}</div>
    <p style="color:#a1a1aa;font-size:12px;margin-top:22px;">We'll email you shipping updates as soon as your kit is dispatched.</p>
    """
    return _wrap(inner)


def order_owner_html(order, user_email: str) -> str:
    rows = "".join([
        f"<tr><td style='padding:6px 0;color:#111;font-size:13px;'>{i.product_name} × {i.qty} (Size {i.size})</td>"
        f"<td style='padding:6px 0;text-align:right;color:#111;font-family:monospace;'>${i.price_at_purchase * i.qty:.2f}</td></tr>"
        for i in order.items
    ])
    addr = order.shipping_address or {}
    return f"""
    <div style="font-family:Helvetica,Arial,sans-serif;color:#111;padding:24px;max-width:640px;">
      <h2 style="margin:0 0 8px;">New KnitCult order</h2>
      <p style="margin:0;color:#666;font-size:13px;">Tracking: <strong>{order.tracking_id}</strong></p>
      <p style="margin:4px 0 16px;color:#666;font-size:13px;">Customer: {user_email} — {order.phone}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        {rows}
        <tr><td colspan="2" style="border-top:1px solid #ddd;padding-top:8px;font-weight:bold;">Total</td></tr>
        <tr><td>Subtotal</td><td style="text-align:right;font-family:monospace;">${order.subtotal:.2f}</td></tr>
        <tr><td>Discount</td><td style="text-align:right;font-family:monospace;">-${order.discount:.2f}</td></tr>
        <tr><td><strong>Total charged</strong></td><td style="text-align:right;font-family:monospace;"><strong>${order.total:.2f}</strong></td></tr>
      </table>
      <h3 style="margin:20px 0 6px;">Ship to</h3>
      <div style="color:#333;font-size:13px;line-height:1.5;">
        {addr.get('name', '')}<br>{addr.get('line1', '')}<br>{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}<br>{addr.get('country', '')}
      </div>
    </div>
    """
