// เปลี่ยนเฉพาะบางบรรทัดจากของเดิม

const escpos = require("escpos");
escpos.USB = require("escpos-usb");
const iconv = require("iconv-lite");

class PrinterService {
  constructor() {
    this.device = null;
    this.printer = null;
  }

  async initialize() {
    try {
      this.device = new escpos.USB();
      await new Promise((resolve, reject) => {
        this.device.open(err => (err ? reject(err) : resolve()));
      });

      // ใช้ CP874 ให้ชัดเจน (จะใช้ "tis-620" ก็ได้ ลองได้ทั้งคู่)
      this.printer = new escpos.Printer(this.device, { encoding: "cp874" });

      console.log("Printer ES-8803 connected successfully");
      return true;
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      return false;
    }
  }

  // เข้ารหัสไทย -> CP874 (ถ้าอยากสลับไป TIS-620 เปลี่ยนตรงนี้พอ)
  encodeThaiText(text) {
    try {
      return iconv.encode(text ?? "", "cp874");
    } catch {
      return Buffer.from(String(text ?? ""), "utf8");
    }
  }

  async printReceipt(data) {
    if (!this.printer) throw new Error("Printer not initialized");

    return new Promise((resolve, reject) => {
      const customerName = (data.customer || "ลูกค้าเดินมาเอง").slice(0, 18);

      this.printer
        .font("a")
        .size(0, 0)
        .align("ct")
        .raw(this.encodeThaiText("ใบเสร็จรับเงิน\n"))
        .text("=========================")
        .align("ct")
        .text(`Date: ${new Date(data.date || Date.now()).toLocaleDateString("th-TH")}`)
        .text(`Time: ${new Date().toLocaleTimeString("th-TH")}`)
        .text("-------------------------")
        .text(`Order: ${(data.orderId || "N/A").substring(0, 20)}`)
        .raw(this.encodeThaiText(`ลูกค้า: ${customerName}\n`))
        .text("-------------------------")
        .raw(this.encodeThaiText("รายการสินค้า:\n"));

      if (Array.isArray(data.items)) {
        data.items.forEach((item) => {
          const itemName = (item.name || "").length > 20 ? item.name.slice(0, 17) + "..." : (item.name || "");
          this.printer
            .raw(this.encodeThaiText(`${itemName}\n`))
            .text(`${item.quantity}x${Number(item.price).toFixed(2)} = ${Number(item.total ?? item.price * item.quantity).toFixed(2)} THB`);
        });
      }

      this.printer
        .text("-------------------------")
        .align("rt")
        .text(`Total: ${Number(data.total || 0).toFixed(2)} THB`)
        .align("ct")
        .text("=========================")
        .raw(this.encodeThaiText("ขอบคุณที่ใช้บริการ!\n"))
        .text("Thank you for shopping!")
        .feed(2)
        .cut()
        .close(err => (err ? reject(err) : resolve("Print successful")));
    });
  }

  async close() {
    if (this.device) await new Promise((resolve) => this.device.close(() => resolve()));
  }
}

module.exports = new PrinterService();
