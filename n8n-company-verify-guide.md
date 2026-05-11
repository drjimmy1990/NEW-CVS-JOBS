# GrowthNexus Company Verification Engine - n8n Workflow Guide

This guide will walk you through building the automated OCR Company Verification workflow in n8n step-by-step. This workflow is triggered by Supabase, downloads the trade license, extracts data using Google Gemini Vision, scores the company risk, and updates the database.

## Prerequisites
- A running n8n instance.
- Supabase Project URL and Service Role Key.
- Google AI Studio (Gemini) API Key.

---

## 1. Webhook Node (Trigger)
This node receives the payload from Supabase when a new document is uploaded to `company_documents`.

- **Node Type**: `Webhook`
- **Settings**:
  - **Authentication**: `None`
  - **HTTP Method**: `POST`
  - **Path**: `gn-company-verify` (or whatever you prefer)
  - **Respond**: `Immediately`
- **Next Step**: Go to your Supabase Dashboard -> Database -> Webhooks. Create a new webhook on the `company_documents` table for `INSERT` operations and point it to the Test/Production URL of this Webhook node.

---

## 2. HTTP Request Node (Download Document)
This node downloads the actual file from your private Supabase storage bucket using the URL path provided in the webhook.

- **Node Type**: `HTTP Request`
- **Settings**:
  - **Authentication**: `Generic Credential Type` -> `Header Auth`
    - *Create a credential:* Name: `Supabase Service Role`, Name: `Authorization`, Value: `Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`
  - **Method**: `GET`
  - **URL**: `{{ $env.SUPABASE_URL }}/storage/v1/object/authenticated/company_documents/{{ $json.body.record.file_url }}`
    - *(Note: Adjust the `$env` variable or hardcode your Supabase URL)*
  - **Response Format**: `File`
- **Output**: This will download the image/PDF into the binary data stream of n8n.

**Test Download via cURL (Optional):**
You can verify your Service Role Key permissions by running this cURL command in your terminal:
```bash
curl -G -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  "YOUR_SUPABASE_URL/storage/v1/object/authenticated/company_documents/USER_ID/FILE_NAME.ext" \
  -o test_download.ext
```

---

## 3. Google Gemini Node (AI OCR)
This node processes the image to extract the official details of the company from the Trade License.

- **Node Type**: `Google Gemini` (or the equivalent AI agent/LLM node configured for Gemini Vision).
- **Settings**:
  - **Credential**: Add your Google Gemini API Key.
  - **Model**: `gemini-1.5-pro` (or `gemini-1.5-flash` if preferred for speed).
  - **Input**: Map the binary file from the HTTP Request node.
  - **Prompt**:
    ```text
    You are a legal document analyzer. Analyze the attached Trade License (which may be in Arabic or English).
    Extract the following information and return ONLY a valid JSON object with NO markdown formatting:
    {
      "official_name": "...",
      "trade_license_number": "...",
      "expiry_date": "YYYY-MM-DD"
    }
    ```

---

## 4. Code Node (Decision Engine)
This node parses the AI result, compares it (if needed), and assigns a verification status.

- **Node Type**: `Code`
- **Language**: `JavaScript`
- **Code**:
  ```javascript
  // 1. Get the parsed JSON from Gemini
  const aiResultText = $input.item.json.text || $input.item.json.output;
  // If Gemini wrapped it in ```json, we clean it up:
  const cleanJson = aiResultText.replace(/```json/g, '').replace(/```/g, '').trim();
  const aiResult = JSON.parse(cleanJson);

  // 2. Get the original Supabase Webhook data
  const dbRecord = $node['Webhook'].json.body.record;

  // 3. Logic for Risk Score & Status
  let riskScore = 80; // Base score
  let verificationStatus = 'trusted';
  let riskLevel = 'low';
  let notes = [];

  // Check if we found a trade license number
  if (!aiResult.trade_license_number || aiResult.trade_license_number === '') {
    riskScore -= 40;
    verificationStatus = 'limited';
    riskLevel = 'high';
    notes.push('Could not detect Trade License Number via OCR.');
  }

  // Check expiry date
  if (aiResult.expiry_date) {
    const expiry = new Date(aiResult.expiry_date);
    if (expiry < new Date()) {
      riskScore -= 30;
      verificationStatus = 'under_review';
      riskLevel = 'medium';
      notes.push('Trade License appears to be expired.');
    }
  }

  // 4. Return the calculated payload for the next nodes
  return {
    company_id: dbRecord.company_id,
    document_id: dbRecord.id,
    ai_data: aiResult,
    risk_score: riskScore,
    verification_status: verificationStatus,
    risk_level: riskLevel,
    notes: notes.length > 0 ? notes.join(' | ') : 'Verification passed automatically.'
  };
  ```

---

## 5. Supabase Nodes (Update Database)
Now we need to update our Supabase tables with the results. You will create 3 sequential Supabase nodes. 

*Make sure you create a Supabase API credential in n8n (using your Project URL and Service Role Key).*

### Node 5A: Update Company
- **Node Type**: `Supabase`
- **Operation**: `Update`
- **Table**: `companies`
- **Update Key**: `id`
- **Fields to Update**:
  - `id`: `={{ $json.company_id }}`
  - `verification_status`: `={{ $json.verification_status }}`
  - `risk_score`: `={{ $json.risk_score }}`
  - `risk_level`: `={{ $json.risk_level }}`

### Node 5B: Update Document Record
- **Node Type**: `Supabase`
- **Operation**: `Update`
- **Table**: `company_documents`
- **Update Key**: `id`
- **Fields to Update**:
  - `id`: `={{ $json.document_id }}`
  - `ocr_status`: `completed`
  - `ocr_data`: `={{ $json.ai_data }}`

### Node 5C: Create Audit Log
- **Node Type**: `Supabase`
- **Operation**: `Insert`
- **Table**: `company_verification_log`
- **Fields to Insert**:
  - `company_id`: `={{ $json.company_id }}`
  - `action`: `={{ $json.verification_status === 'trusted' ? 'approved' : 'flagged' }}`
  - `notes`: `={{ $json.notes }}`
  - `metadata`: `={{ { "ocr_extracted": $json.ai_data, "risk_score": $json.risk_score } }}`

---

## 6. Testing the Workflow
1. Activate the workflow and click **Execute Workflow** (to listen for the test webhook).
2. Go to your local application (`http://localhost:3000/register/employer`) and submit a new employer registration with an image file.
3. Watch the execution in n8n as it downloads the file, passes it to Gemini, and updates the database records automatically!
