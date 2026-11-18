# Campus Stores

Campus Stores is an offline sample register for a campus media equipment desk. The work sample follows a screening across pickup, partial return, handover, and follow-up.

## What I built

Five improvements address connected operational gaps.

- **Shift handover:** The Desk book surfaces outstanding physical units, asks the incoming employee to accept ownership, and records a concrete next action.
- **Return condition:** A return must be checked as Good, Damaged, or Missing accessories. Damaged and incomplete units are held out of issue instead of silently returning to shelf availability.
- **Item activity:** The Desk book shows when each unit was issued and returned, by whom, and its recorded return condition. The open loan remains open until its unit is actually returned.
- **Scheduling:** The Science Society’s pending request shows its Saturday pickup window and checks matching physical units before approval. Approval reserves a unit. A later issue cannot overlap that reservation.
- **Overdue follow-up:** The loan register flags past-due items, records reminders, return promises and referrals to the desk lead, and keeps a timestamped history after the return.

## Design decisions

The app stores records in the browser and works offline. A return condition applies to one physical unit, and damaged or incomplete units stay out of issue. The schedule checks physical units because the spare projector is already in repair. An overdue unit cannot support an approval until it comes back, even if a new return time was promised. Follow-ups record actions taken by staff and keep the original due time alongside any later promise.

## Walkthrough

1. Open **Loan register** at Friday 3:45 pm and issue the Film Society projector, speaker, and USB-C adapter on separate slips to Kabir Sen, using request RQ-214 and the Friday 8 pm due time.
2. Use **Move to return time**. In **Loan register**, record the projector and speaker returns with condition **Good**. The adapter remains outstanding.
3. Use **Move to next morning**. Open **Desk book**. The open adapter appears with its borrower and due time. Choose the incoming employee, review/edit the next action, and select **Accept handover**.
4. Record the adapter return in **Loan register**, choose its condition, and save. A Good return closes only that slip and returns the unit to shelf. A Damaged or Missing accessories return closes the loan but holds the unit from issue. **Desk book** retains the activity history and accepted handover.

### Try a projector conflict and escalation

1. Restart the sample and issue projector **PR-04** to **Kabir Sen** under **RQ-214**, due **Fri 8 pm**. Leave it outstanding as you advance to Saturday morning.
2. In **Requests**, open **Saturday outreach demo (RQ-221)**. It needs a projector from **Sat 9:15 am** through **Sat 11 am**. PR-04 is overdue and PR-06 is unavailable, so approval is blocked.
3. In **Loan register**, choose **Log follow-up for PR-04** and record a **Return promise logged** action with **Sat 10 am** and a note. Select **Move to follow-up time**. At 10:30 am the promise is flagged as missed. Log **Escalated to desk lead** and open **Follow-up history** to see both actions.
4. Return PR-04 in **Good** condition. Under **All slips**, the history shows the return resolved the follow-up. Reopen RQ-221 and approve it with PR-04. The request now shows the reserved unit.

**Success measure:** At a real counter, measure the share of shift changes with unresolved loans where the incoming employee records both an owner and next action before the prior shift ends. Compare the rate before and after introducing the handover step; an increase indicates clearer ownership. No real-counter results are claimed here.

## How to run

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and runs offline. Alternatively, from this folder run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://localhost:8000`. Each browser stores its sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records.


## Known limitations

- Sample state is local to one browser and is not shared across desk employees or devices.
- Acknowledgment and activity entries are not tamper-resistant audit records.
- Handover acceptance is available from Saturday morning when an open loan exists.
- Damaged or missing-accessory units need staff inspection; the sample has no repair-resolution workflow to return them to availability.
- Scheduling covers the sample’s one explicit pickup window. Follow-up entries are manual, and the clock has four preset times.

## Source and license

- `index.html` contains the desk layout and candidate brief.
- `app.js` contains sample records, state transitions, and rendering.
- `styles.css` defines the responsive layout.
- Icon license notices are in [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).
