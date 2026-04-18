import { twilioClient, twilioFromNumber } from "./twilio";

export type TwilioAccountStatus = {
  sid: string;
  friendlyName: string | null;
  status: string;
  type: string | null;
};

export type TwilioNumberStatus = {
  number: string;
  friendlyName: string | null;
  sms: boolean;
  mms: boolean;
  voice: boolean;
  smsUrl: string | null;
  smsMethod: string | null;
  dateCreated: Date | null;
  notFound: boolean;
};

export type TwilioMessageRow = {
  sid: string;
  to: string | null;
  from: string | null;
  status: string;
  errorCode: number | null;
  errorMessage: string | null;
  body: string | null;
  dateCreated: Date | null;
};

export type TwilioStatus = {
  ok: boolean;
  error?: string;
  fromNumber?: string;
  account?: TwilioAccountStatus;
  phone?: TwilioNumberStatus;
  messages?: TwilioMessageRow[];
};

export async function fetchTwilioStatus(): Promise<TwilioStatus> {
  let from: string;
  try {
    from = twilioFromNumber();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    const client = twilioClient();
    const [account, numbers, messages] = await Promise.all([
      client.api.v2010.accounts(client.accountSid).fetch(),
      client.incomingPhoneNumbers.list({ phoneNumber: from, limit: 1 }),
      client.messages.list({ from, limit: 10 }),
    ]);
    const num = numbers[0];
    const phone: TwilioNumberStatus = num
      ? {
          number: num.phoneNumber,
          friendlyName: num.friendlyName ?? null,
          sms: Boolean(num.capabilities?.sms),
          mms: Boolean(num.capabilities?.mms),
          voice: Boolean(num.capabilities?.voice),
          smsUrl: num.smsUrl ?? null,
          smsMethod: num.smsMethod ?? null,
          dateCreated: num.dateCreated ?? null,
          notFound: false,
        }
      : {
          number: from,
          friendlyName: null,
          sms: false,
          mms: false,
          voice: false,
          smsUrl: null,
          smsMethod: null,
          dateCreated: null,
          notFound: true,
        };
    return {
      ok: true,
      fromNumber: from,
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName ?? null,
        status: account.status,
        type: account.type ?? null,
      },
      phone,
      messages: messages.map((m) => ({
        sid: m.sid,
        to: m.to ?? null,
        from: m.from ?? null,
        status: m.status,
        errorCode: m.errorCode ?? null,
        errorMessage: m.errorMessage ?? null,
        body: m.body ?? null,
        dateCreated: m.dateCreated ?? null,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      fromNumber: from,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
