import axios from 'axios';
import { config } from '../config';
import { prisma } from '../config/database';

interface WhatsAppMessage {
  to: string;
  message: string;
  messageType?: string;
}

class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor() {
    this.apiUrl = config.evolution.apiUrl;
    this.apiKey = config.evolution.apiKey;
    this.instanceName = config.evolution.instanceName;
  }

  /**
   * Send a text message via Evolution API
   */
  private async sendMessage(data: WhatsAppMessage): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/message/sendText/${this.instanceName}`,
        {
          number: data.to,
          text: data.message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Log WhatsApp message to database
   */
  private async logMessage(
    to: string,
    message: string,
    leadId?: string,
    admissionId?: string,
    status: string = 'sent',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.whatsAppLog.create({
        data: {
          to,
          message,
          messageType: 'text',
          leadId,
          admissionId,
          status,
          errorMessage,
          deliveredAt: status === 'delivered' ? new Date() : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to log WhatsApp message:', error);
    }
  }

  /**
   * Send new lead notification
   */
  async sendNewLeadNotification(lead: any): Promise<void> {
    try {
      const message = `🎯 *New Lead Alert!*\n\n` +
        `Name: ${lead.firstName} ${lead.lastName}\n` +
        `Phone: ${lead.phone}\n` +
        `Email: ${lead.email || 'N/A'}\n` +
        `Source: ${lead.source}\n` +
        `Interested Course: ${lead.interestedCourse || 'N/A'}\n\n` +
        `Branch: ${lead.branch?.name}\n` +
        `Created by: ${lead.createdBy?.firstName} ${lead.createdBy?.lastName}\n\n` +
        `Please follow up soon! 📞`;

      await this.sendMessage({
        to: lead.phone,
        message,
      });

      await this.logMessage(lead.phone, message, lead.id, undefined, 'sent');
    } catch (error: any) {
      await this.logMessage(
        lead.phone,
        'Failed to send new lead notification',
        lead.id,
        undefined,
        'failed',
        error.message
      );
    }
  }

  /**
   * Send follow-up reminder
   */
  async sendFollowUpReminder(lead: any): Promise<void> {
    try {
      const message = `👋 Hello ${lead.firstName}!\n\n` +
        `This is a friendly reminder from Fortune Campus.\n\n` +
        `We noticed your interest in our ${lead.interestedCourse || 'courses'}. ` +
        `Our team would love to help you get started!\n\n` +
        `📞 Feel free to call us or reply to this message.\n\n` +
        `We look forward to hearing from you! 🎓`;

      await this.sendMessage({
        to: lead.phone,
        message,
      });

      await this.logMessage(lead.phone, message, lead.id, undefined, 'sent');
    } catch (error: any) {
      await this.logMessage(
        lead.phone,
        'Failed to send follow-up reminder',
        lead.id,
        undefined,
        'failed',
        error.message
      );
    }
  }

  /**
   * Send admission confirmation
   */
  async sendAdmissionConfirmation(admission: any): Promise<void> {
    try {
      const message = `🎉 *Congratulations!*\n\n` +
        `Dear ${admission.firstName} ${admission.lastName},\n\n` +
        `Your admission has been confirmed at Fortune Campus! 🎓\n\n` +
        `📋 *Admission Details:*\n` +
        `Admission Number: ${admission.admissionNumber}\n` +
        `Course: ${admission.course?.name || 'N/A'}\n` +
        `Batch: ${admission.batchName || 'N/A'}\n` +
        `Fee Amount: ₹${admission.feeAmount}\n\n` +
        `Welcome to the Fortune family! We're excited to have you on board. 🚀\n\n` +
        `For any queries, feel free to contact us.`;

      await this.sendMessage({
        to: admission.phone,
        message,
      });

      await this.logMessage(admission.phone, message, undefined, admission.id, 'sent');
    } catch (error: any) {
      await this.logMessage(
        admission.phone,
        'Failed to send admission confirmation',
        undefined,
        admission.id,
        'failed',
        error.message
      );
    }
  }

  /**
   * Send custom message
   */
  async sendCustomMessage(to: string, message: string): Promise<void> {
    try {
      await this.sendMessage({ to, message });
      await this.logMessage(to, message, undefined, undefined, 'sent');
    } catch (error: any) {
      await this.logMessage(to, message, undefined, undefined, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Check instance status
   */
  async checkInstanceStatus(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/instance/connectionState/${this.instanceName}`,
        {
          headers: {
            'apikey': this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to check instance status:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
