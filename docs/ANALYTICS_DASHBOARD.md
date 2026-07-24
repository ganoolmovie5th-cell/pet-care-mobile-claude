# Analytics Dashboard Setup

## Overview

Dashboard displays key metrics: DAU, ARPU, churn, revenue, booking trends.

## BigQuery Setup

1. **Dataset:** `pet_care_analytics` (auto-created by nightly export)
2. **Table:** `analytics_events` with schema:
   - id: STRING
   - eventType: STRING
   - userId: STRING
   - vetId: STRING
   - metadata: JSON
   - timestamp: TIMESTAMP
   - date: DATE

## Data Studio Dashboard

### Creation Steps

1. Go to https://datastudio.google.com
2. Create new report
3. Add BigQuery data source:
   - Project: `pet-care-prod`
   - Dataset: `pet_care_analytics`
   - Table: `analytics_events`

### Recommended Charts

#### 1. Daily Active Users (DAU)
- Metric: COUNT(DISTINCT userId)
- Dimension: date
- Chart: Line chart

#### 2. Bookings Trend
- Filter: eventType = 'booking_created'
- Metric: COUNT(id)
- Dimension: date
- Chart: Column chart

#### 3. Total Revenue
- Dimension: date
- Metric: SUM(metadata.amount)
- Chart: Scorecard

#### 4. ARPU (Average Revenue Per User)
- Calculated field: SUM(metadata.amount) / COUNT(DISTINCT userId)
- Dimension: date
- Chart: Line chart

#### 5. Churn Rate
- Calculate: (Vets inactive last 7 days / Total active vets) × 100
- Manual calculation from analytics_events

#### 6. Event Breakdown Pie Chart
- Dimension: eventType
- Metric: COUNT(id)
- Chart: Pie chart

### Access Control

1. Share dashboard with admin@petcare.id only
2. Set to "View" permission (read-only)
3. Enable email delivery of daily report snapshot

### Metrics Dashboard URL

Once created, share link format:
```
https://datastudio.google.com/reporting/YOUR_REPORT_ID
```

This is shared with analytics@petcare.id and stakeholders.
