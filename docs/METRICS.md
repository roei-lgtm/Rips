# Demo metric glossary

All money is simulated. USD formatting does not imply a real payment or redemption.

| Metric                               | Definition                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Demo wallet top-ups                  | Sum of `demo_topup` ledger credits; not revenue                                                           |
| Pack sales                           | Negative sum of `pack_purchase` ledger debits, shown positive                                             |
| Turnover                             | Same pack purchase volume as pack sales; top-ups and recycled sell credits are not added                  |
| Openings count                       | Persistent openings created in selected period                                                            |
| Gross margin before ops              | Pack sales minus snapshotted market value allocated to openings; illustrative economics, not GAAP revenue |
| Theoretical pack margin              | Pack price minus weighted expected market value; available as pack price and computed RTP                 |
| Realized market RTP                  | Sum of snapshotted outcome market values / pack sales × 100                                               |
| Expected market RTP                  | Weighted market-value outcomes / pack price × 100; per published version                                  |
| Expected cash sell-value RTP         | Expected market value × configured sell policy / pack price × 100                                         |
| Realized payout via sell             | Sum of actual `sell_credit` ledger amounts                                                                |
| Observed cash sell RTP               | Actual sell credits / pack sales × 100; observed cash-outs, not theoretical RTP                           |
| Collected card value                 | Current collected, shipping-requested and shipped card market values                                      |
| Available inventory acquisition cost | In-stock unique acquisition costs plus pooled available units × unit cost                                 |
| Low stock                            | Eligible units below configured tier minimum; zero stock blocks every pack referencing that tier          |

Time filters apply to top-ups, purchases, openings and sells. Collected value and inventory cost are current stock views. Charts show the last seven days. Today means the last 24 hours; the UI labels it accordingly. Versioned odds remain attached to each opening. Pack/category breakdown sums purchases once. No performance or value is guaranteed.

Example $10 pack: 60% × $1 + 30% × $10 + 8% × $20 + 2% × $100 = $7.20 expected market value, **72% RTP**, $2.80 theoretical margin. Premium $50 pack: 40% × $4 + 40% × $20 + 18% × $100 + 2% × $750 = $42.60, **85.2% RTP**. The configurable 96% target is not achieved by these seed tables.
