import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER) {
      this.logger.warn(`SMTP not configured. Mock Email to ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Toloud Marketplace" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
    }
  }

  async sendOfferNotification(sellerEmail: string, domainName: string, offerAmount: number) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">New Offer on ${domainName}!</h2>
        <p>Hello,</p>
        <p>Great news! You have received a new offer of <strong>₹${offerAmount}</strong> for your domain <strong>${domainName}</strong>.</p>
        <p>Please log in to your Toloud seller dashboard to review and accept or reject this offer.</p>
        <br/>
        <a href="https://toloud.com/dashboard/offers" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Offer</a>
        <br/><br/>
        <p>Regards,<br/>The Toloud Team</p>
      </div>
    `;
    await this.sendMail(sellerEmail, `New Offer for ${domainName}`, html);
  }

  async sendOfferAcceptedNotification(buyerEmail: string, domainName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">Offer Accepted: ${domainName}</h2>
        <p>Hello,</p>
        <p>Fantastic! The seller has accepted your offer for <strong>${domainName}</strong>.</p>
        <p>Please proceed to checkout to secure your domain in Escrow.</p>
        <br/>
        <a href="https://toloud.com/dashboard/purchases" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Proceed to Checkout</a>
        <br/><br/>
        <p>Regards,<br/>The Toloud Team</p>
      </div>
    `;
    await this.sendMail(buyerEmail, `Offer Accepted for ${domainName}`, html);
  }

  async sendVerificationSuccess(userEmail: string, domainName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #8b5cf6;">Domain Verified: ${domainName}</h2>
        <p>Hello,</p>
        <p>Your TXT record for <strong>${domainName}</strong> has been successfully verified.</p>
        <p>Your domain is now public and visible to buyers on the marketplace.</p>
        <br/>
        <p>Regards,<br/>The Toloud Team</p>
      </div>
    `;
    await this.sendMail(userEmail, `Domain Verified - ${domainName}`, html);
  }

  async sendLeadNotification(adminEmail: string, lead: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f59e0b;">New Brokerage Lead!</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Message:</strong> ${lead.message}</p>
        <p>Log in to the Admin Panel to manage this lead.</p>
      </div>
    `;
    await this.sendMail(adminEmail, `New Brokerage Lead`, html);
  }

  async sendEscrowStarted(sellerEmail: string, domainName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Domain in Escrow: ${domainName}</h2>
        <p>Great news! A buyer has initiated an escrow transaction for <strong>${domainName}</strong>.</p>
        <p>Please log in to your dashboard to view the transaction details.</p>
      </div>
    `;
    await this.sendMail(sellerEmail, `Escrow Started for ${domainName}`, html);
  }

  async sendEscrowCompleted(sellerEmail: string, buyerEmail: string, domainName: string, amount: number) {
    const sellerHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">Escrow Completed!</h2>
        <p>The transaction for <strong>${domainName}</strong> has been completed successfully.</p>
        <p>Your wallet has been credited with <strong>₹${amount}</strong>.</p>
      </div>
    `;
    await this.sendMail(sellerEmail, `Escrow Completed - Funds Released`, sellerHtml);

    const buyerHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">Escrow Completed!</h2>
        <p>Your transaction for <strong>${domainName}</strong> is complete and you have full ownership.</p>
        <p>Thank you for using Toloud Marketplace.</p>
      </div>
    `;
    await this.sendMail(buyerEmail, `Transaction Complete: ${domainName}`, buyerHtml);
  }
}
