import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

interface NotificationPreference {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  phoneNumber?: string;
}

interface Notification {
  userId: string;
  type: 'renewal' | 'claim' | 'alert';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  channel: 'email' | 'sms' | 'push';
  createdAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private messaging;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.messaging = getMessaging();
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPushPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return null;
    }
  }

  async sendRenewalReminder(policyId: string, userId: string): Promise<void> {
    try {
      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      if (!userPrefs) return;

      // Get policy details
      const policyDoc = await db.collection('policies').doc(policyId).get();
      if (!policyDoc.exists) return;

      const policy = policyDoc.data();
      const message = `Your ${policy.type} insurance policy (${policy.policyNumber}) is due for renewal on ${policy.endDate}.`;

      // Create notification records
      const notifications: Notification[] = [];

      if (userPrefs.email) {
        notifications.push({
          userId,
          type: 'renewal',
          title: 'Policy Renewal Reminder',
          message,
          status: 'pending',
          channel: 'email',
          createdAt: new Date()
        });
      }

      if (userPrefs.sms && userPrefs.phoneNumber) {
        notifications.push({
          userId,
          type: 'renewal',
          title: 'Policy Renewal Reminder',
          message,
          status: 'pending',
          channel: 'sms',
          createdAt: new Date()
        });
      }

      if (userPrefs.push) {
        notifications.push({
          userId,
          type: 'renewal',
          title: 'Policy Renewal Reminder',
          message,
          status: 'pending',
          channel: 'push',
          createdAt: new Date()
        });
      }

      // Save notifications to Firestore
      const batch = db.batch();
      notifications.forEach(notification => {
        const ref = db.collection('notifications').doc();
        batch.set(ref, notification);
      });
      await batch.commit();

      // Trigger Cloud Functions to send actual notifications
      // This will be handled by Firebase Cloud Functions
    } catch (error) {
      console.error('Error sending renewal reminder:', error);
    }
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreference | null> {
    try {
      const prefsDoc = await db.collection('notificationPreferences').doc(userId).get();
      return prefsDoc.exists ? prefsDoc.data() as NotificationPreference : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }
} 