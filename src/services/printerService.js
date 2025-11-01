// const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer");

// class PrinterService {
//   constructor() {
//     this.printer = null;
//     this.isConnected = false;
//   }

//   async initialize() {
//     try {
//       this.printer = new ThermalPrinter({
//         type: PrinterTypes.EPSON,
//         interface: "printer:POS-80C",
//         characterSet: CharacterSet.PC437_USA, 
//         removeSpecialCharacters: false,
//         lineCharacter: "=",
//         driver: require("@thiagoelg/node-printer"),
//         options: {
//           timeout: 5000,
//         },
//       });

//       this.isConnected = true;
//       console.log("Printer POS-80C initialized");
//       return true;
//     } catch (error) {
//       console.error("Failed to initialize printer:", error);
//       this.isConnected = false;
//       return false;
//     }
//   }

//   async checkPrinterStatus() {
//     try {
//       if (!this.printer) return false;
//       return this.isConnected;
//     } catch (error) {
//       console.error("Error checking printer status:", error);
//       this.isConnected = false;
//       return false;
//     }
//   }

//   async disconnect() {
//     try {
//       if (this.printer) {
//         this.printer = null;
//         this.isConnected = false;
//       }
//       console.log("Printer disconnected successfully");
//       return true;
//     } catch (error) {
//       console.error("Error disconnecting printer:", error);
//       this.isConnected = false;
//       this.printer = null;
//       return false;
//     }
//   }

//   async printReceipt(data) {
//     if (!this.printer) throw new Error("Printer not initialized");

//     try {
//       const customerName = (data.customer || "").slice(0, 30);

//       this.printer.clear();
      
//       // หัวใบเสร็จ
//       this.printer.alignCenter();
//       this.printer.setTextSize(1, 1);
//       this.printer.bold(true);
//       this.printer.println("ใบเสร็จรับเงิน");
//       this.printer.bold(false);
      
//       this.printer.drawLine();
      
//       // วันที่และเวลา
//       this.printer.setTextNormal();
//       this.printer.println(`วันที่: ${new Date(data.date || Date.now()).toLocaleDateString("th-TH")}`);
//       this.printer.println(`เวลา: ${new Date().toLocaleTimeString("th-TH")}`);
//       this.printer.drawLine();
      
//       // เลขที่ออเดอร์
//       this.printer.println(`เลขที่: ${(data.orderId || "N/A").substring(0, 20)}`);
      
//       // ชื่อลูกค้า
//       this.printer.println(`ลูกค้า: ${customerName}`);
//       this.printer.drawLine();
      
//       // รายการสินค้า
//       this.printer.bold(true);
//       this.printer.println("รายการสินค้า:");
//       this.printer.bold(false);
      
//       if (Array.isArray(data.items)) {
//         data.items.forEach((item) => {
//           const itemName = (item.name || "").length > 30 
//             ? item.name.slice(0, 27) + "..." 
//             : (item.name || "");
          
//           this.printer.alignLeft();
//           this.printer.println(itemName);
//           this.printer.alignRight();
//           this.printer.println(
//             `${item.quantity} x ${Number(item.price).toFixed(2)} = ${Number(item.total ?? item.price * item.quantity).toFixed(2)} บาท`
//           );
//         });
//       }
      
//       this.printer.alignCenter();
//       this.printer.drawLine();
      
//       // ยอดรวม
//       this.printer.bold(true);
//       this.printer.setTextSize(1, 1);
//       this.printer.alignRight();
//       this.printer.println(`รวมทั้งหมด: ${Number(data.total || 0).toFixed(2)} บาท`);
//       this.printer.bold(false);
//       this.printer.setTextNormal();
      
//       this.printer.alignCenter();
//       this.printer.drawLine();
      
//       // ข้อความท้าย
//       this.printer.println("ขอบคุณที่ใช้บริการ");
//       this.printer.println("Thank you!");
      
//       this.printer.newLine();
//       this.printer.newLine();
//       this.printer.cut();
      
//       await this.printer.execute();
      
//       console.log("Print successful");
//       return "Print successful";
      
//     } catch (error) {
//       console.error("Print receipt error:", error);
//       throw error;
//     }
//   }

//   async close() {
//     return this.disconnect();
//   }
// }

// module.exports = new PrinterService();