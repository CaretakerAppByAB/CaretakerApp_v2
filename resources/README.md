# Mental Health Resources: Content Guide

These four spreadsheets control what the app's **Mental Health Resources** page suggests.
Open them in Excel, Google Sheets or Numbers, edit them, and export back to CSV with the same file name.

## How it works

```
Journal entry ──► keywords.csv ──► emotions.csv ──► resources.csv
 "I'm so stressed"   stress* → overwhelmed    Overwhelmed    "Caregiver Stress" (alz.org)
```

1. The app scans the user's journal entries from the last 14 days. This happens **on the phone only**.
2. Each keyword it finds adds points to an emotion (`weight`). Newer entries count more.
3. The top emotions (up to 3) are shown under **"For you"**, each with its resources.
4. Users can also tap any emotion to browse its resources directly.

## The files

### `emotions.csv`

| column | what to put |
|---|---|
| `emotion_id` | Short lowercase id, e.g. `overwhelmed`. Never rename an id without updating the other files. |
| `label` | What the user sees on the chip, e.g. `Overwhelmed` |
| `is_crisis` | `true` only for the crisis emotion. It shows a red "Call 988" card first and **must** have a resource with a phone number. |
| `sort_order` | Order of the chips (lower = first) |

### `keywords.csv`

| column | what to put |
|---|---|
| `keyword` | A word or phrase, lowercase. End with `*` to match any ending: `stress*` matches stress, stressed, stressful. |
| `emotion_id` | Must exist in `emotions.csv`. The same keyword can appear on multiple rows for different emotions. |
| `weight` | How strongly it signals the emotion. `1` = weak hint ("too much"), `3` = clear ("overwhelmed"), `10` = crisis. An emotion needs **2 points** to be suggested. |
| `notes` | Optional, for your team |

Tips:
- Negations are handled automatically: "I'm **not** stressed" won't count. (Crisis keywords are *never* discounted, on purpose.)
- Avoid very short or ambiguous words (`low`, `down`, `hard`) or give them weight `1`.
- Use phrases caregivers actually write: "doesn't recognize me", "no one understands".

### `resources.csv`

| column | what to put |
|---|---|
| `resource_id` | Unique id, e.g. `alz-caregiver-stress` |
| `title` | Title as shown on the source |
| `type` | One of: `article`, `podcast`, `video`, `hotline`, `tool`, `book` |
| `source` | Organization name, e.g. `Alzheimer's Association` |
| `url` | Full `https://` link. The domain **must** be listed in `trusted_sources.csv`. |
| `phone` | Optional. Shows a "Call" button. |
| `emotion_ids` | One or more emotion ids separated by `\|`, e.g. `sad\|grieving` |
| `last_verified` | Date someone last opened the link and checked it, `YYYY-MM-DD` |

Hotlines are always listed first.

### `trusted_sources.csv`

The list of vetted domains. **A resource can't be added unless its domain is here.** This is how we keep everything credible.
Only add a domain after the team agrees it's reputable, e.g. government health agencies, major hospitals/universities, established nonprofits, or professional associations.
For YouTube or podcast platforms, don't add `youtube.com` wholesale. Link to the organization's own page for the video or podcast where possible, or discuss with the dev team first.

## Publishing changes (developer step)

```bash
npm run build:resources                 # validates the CSVs and regenerates the app data
npm run build:resources -- --check-links # also checks every URL still loads
```

If something is wrong (typo in an emotion id, untrusted domain, duplicate id), the build stops and tells you the file and line number.
Some sites (988lifeline.org, mayoclinic.org, nia.nih.gov) block automated checks with a 403/405. Those show as warnings; just open them in a browser to confirm.

Changes go live with the next app build.
