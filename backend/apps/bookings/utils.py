import qrcode
import io
import base64

def generate_qr_code_base64(booking_id, show_info):
    """
    Generates a QR code for a booking and returns the base64-encoded PNG image string.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=8,
        border=3,
    )
    
    data = f"CineHub-Booking-Verification\nID: {booking_id}\nShow: {show_info}\nStatus: Active"
    
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{qr_base64}"
