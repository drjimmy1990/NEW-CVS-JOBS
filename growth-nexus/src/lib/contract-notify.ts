/**
 * Contract Notification Helper
 * Fires events to n8n for contract lifecycle email notifications.
 * Non-blocking — if n8n is unavailable, the contract operation still succeeds.
 */

type ContractEvent =
    | 'contract_created'
    | 'contract_sent'
    | 'contract_signed'
    | 'contract_declined'

interface ContractNotifyPayload {
    event_type: ContractEvent
    contract_id: string
    candidate_name: string
    candidate_email?: string
    company_name: string
    employer_email?: string
    job_title: string
    salary: number
    currency: string
    start_date: string
    decline_reason?: string | null
    contract_url?: string
}

export async function notifyContractEvent(payload: ContractNotifyPayload): Promise<void> {
    const webhookUrl = process.env.N8N_CONTRACT_NOTIFY_WEBHOOK
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET

    if (!webhookUrl || !webhookSecret) {
        console.info(`[Contract Notify] No webhook configured — skipping '${payload.event_type}' event.`)
        return
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const contractUrl = `${baseUrl}/candidate/contracts/${payload.contract_id}`

        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': webhookSecret,
            },
            body: JSON.stringify({
                ...payload,
                contract_url: contractUrl,
            }),
        })

        console.info(`[Contract Notify] Sent '${payload.event_type}' event for contract ${payload.contract_id}`)
    } catch (err: any) {
        // Non-blocking: contract operations should not fail because of n8n
        console.warn(`[Contract Notify] Failed to send '${payload.event_type}':`, err.message)
    }
}
