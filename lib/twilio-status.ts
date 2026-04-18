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

export type TwilioBrandRow = {
  sid: string;
  friendlyName: string | null;
  brandType: string | null;
  status: string;
  failureReason: string | null;
  dateCreated: Date | null;
};

export type TwilioCampaignRow = {
  sid: string;
  serviceSid: string;
  brandSid: string | null;
  useCase: string | null;
  status: string;
  description: string | null;
  dateCreated: Date | null;
};

export type TwilioStatus = {
  ok: boolean;
  error?: string;
  fromNumber?: string;
  account?: TwilioAccountStatus;
  phone?: TwilioNumberStatus;
  messages?: TwilioMessageRow[];
  brands?: TwilioBrandRow[];
  campaigns?: TwilioCampaignRow[];
  a2pError?: string;
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
    // A2P 10DLC: brands + campaigns across all messaging services. These
    // endpoints can throw on fresh accounts without any brand yet, so we
    // isolate failures and surface them without breaking the rest.
    let brands: TwilioBrandRow[] | undefined;
    let campaigns: TwilioCampaignRow[] | undefined;
    let a2pError: string | undefined;
    try {
      const brandList = await client.messaging.v1.brandRegistrations.list({ limit: 20 });
      brands = brandList.map((b) => ({
        sid: b.sid,
        friendlyName: b.brandFeedback?.toString() ?? null,
        brandType: (b as unknown as { brandType?: string }).brandType ?? null,
        status: b.status,
        failureReason: b.failureReason ?? null,
        dateCreated: b.dateCreated ?? null,
      }));
      const services = await client.messaging.v1.services.list({ limit: 20 });
      const campaignResults = await Promise.all(
        services.map(async (svc) => {
          try {
            const list = await client.messaging.v1
              .services(svc.sid)
              .usAppToPerson.list({ limit: 20 });
            return list.map<TwilioCampaignRow>((c) => ({
              sid: c.sid,
              serviceSid: svc.sid,
              brandSid: (c as unknown as { brandRegistrationSid?: string }).brandRegistrationSid ?? null,
              useCase: (c as unknown as { usAppToPersonUsecase?: string }).usAppToPersonUsecase ?? null,
              status: (c as unknown as { campaignStatus?: string }).campaignStatus ?? "UNKNOWN",
              description: c.description ?? null,
              dateCreated: c.dateCreated ?? null,
            }));
          } catch {
            return [];
          }
        }),
      );
      campaigns = campaignResults.flat();
    } catch (err) {
      a2pError = err instanceof Error ? err.message : String(err);
    }

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
      brands,
      campaigns,
      a2pError,
    };
  } catch (err) {
    return {
      ok: false,
      fromNumber: from,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
