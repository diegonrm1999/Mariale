import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { PdfService } from 'src/pdf/pdf.service';
import { OrderReceiptData } from './dto/order-receipt.dto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private pdfService: PdfService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASSWORD'),
        },
      });
    } catch (error) {
      throw new Error('No se pudo configurar el servicio de email');
    }
  }

  async sendOrderReceipt(receiptData: OrderReceiptData): Promise<void> {
    try {
      const pdfBuffer = await this.pdfService.generateReceiptPDF(receiptData);
      const mailOptions: Mail.Options = {
        from: {
          name: receiptData.shopName,
          address: this.configService.get<string>('SMTP_FROM'),
        },
        to: receiptData.clientEmail,
        subject: `Boleta de Venta - ${receiptData.shopName} - #${receiptData.orderNumber}`,
        html: this.createSimpleEmailBody(receiptData),
        attachments: [
          {
            filename: `boleta-${receiptData.orderNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('Error al enviar el recibo');
    }
  }

  private createSimpleEmailBody(data: OrderReceiptData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">¡Gracias por su compra!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Detalles de su compra:</h3>
          <p><strong>Cliente:</strong> ${data.clientName}</p>
          <p><strong>Orden:</strong> #${data.orderNumber}</p>
          <p><strong>Fecha:</strong> ${data.date} a las ${data.time}</p>
          <p><strong>Total:</strong> ${data.currency}${data.totalPrice.toFixed(2)}</p>
        </div>
        
        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
          <p style="margin: 0;"><strong>📎 Su boleta está adjunta en este correo como archivo PDF.</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
            Puede descargar e imprimir su boleta desde el archivo adjunto.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <h3 style="color: #2c3e50;">${data.shopName}</h3>
          <p style="color: #666; font-size: 14px;">${data.shopAddress1}</p>
          <p style="color: #666; font-size: 14px;">${data.shopAddress2}</p>
          <p style="color: #666; font-size: 14px;">${data.shopAddress3}</p>
          <p style="color: #666; font-size: 14px;">Tel: ${data.shopPhone}</p>
        </div>
        
        <p style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          ¡Esperamos verle pronto nuevamente!
        </p>
      </div>
    `;
  }
}
