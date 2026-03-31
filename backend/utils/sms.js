const otps = {};

async function sendRealSMS(tel, otp) {
    try {
        console.log(`[SMS Gateway] กำลังส่งรหัส ${otp} ไปยังเบอร์ ${tel}...`);
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            const twilio = require('twilio');
            const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            await client.messages.create({
                body: `HomeLink OTP: ${otp} (รหัสยืนยันตัวตนผู้ขายของคุณ)`,
                to: `+66${tel.substring(1)}`, 
                from: process.env.TWILIO_PHONE_NUMBER
            });
            return true;
        }
        if (process.env.SMS2PRO_API_KEY) {
            const axios = require('axios');
            await axios.post('https://api.sms2pro.com/v1/sms', {
                recipient: tel, message: `HomeLink OTP: ${otp}`, sender: 'HomeLink'
            }, {
                headers: { 'Authorization': `Bearer ${process.env.SMS2PRO_API_KEY}` }
            });
            return true;
        }
        console.log('⚠️ [Mock Mode] จำลองการส่ง SMS');
        return true;
    } catch (error) {
        console.error('❌ SMS Sending Failed:', error.message);
        return false;
    }
}

module.exports = { otps, sendRealSMS };
