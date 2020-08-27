import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import type {Request, Response} from 'express';

const expo = new Expo();

const pushNotifs = async (req : Request, res: Response) => {
  if (!req.body.message || !req.body.tokens) {
    res.sendStatus(400);
    return;
  }

  const {tokens, message} = req.body;

  const requests : ExpoPushMessage[] = [];
  tokens.forEach((token : string) =>  {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not valid.`);
      return;
    }

    requests.push({
      to: token,
      sound: 'default',
      body: message,
    });
  });

  const chunks = expo.chunkPushNotifications(requests);
  const tickets = [];

  for(const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  res.sendStatus(200);
};

export default pushNotifs;