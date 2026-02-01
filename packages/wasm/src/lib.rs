use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Deserialize)]
pub struct RecurrenceInput {
    pub frequency: String,        // "daily" | "weekly" | "monthly" | "yearly"
    pub interval: u32,            // e.g., every N days/weeks/months/years
    pub start_date: String,       // ISO date: "YYYY-MM-DD"
    pub end_date: Option<String>, // optional recurrence end date
    pub max_occurrences: Option<u32>,
    pub excluded_dates: Vec<String>,  // ISO date strings
    pub days_of_week: Vec<u32>,       // 0=Sun..6=Sat for weekly
    pub day_of_month: Option<u32>,    // 1-31 for monthly
}

#[derive(Serialize)]
pub struct OccurrenceResult {
    pub dates: Vec<String>,
}

/// Parse "YYYY-MM-DD" into (year, month, day)
fn parse_date(s: &str) -> Option<(i32, u32, u32)> {
    let parts: Vec<&str> = s.split('-').collect();
    if parts.len() != 3 {
        return None;
    }
    let y = parts[0].parse::<i32>().ok()?;
    let m = parts[1].parse::<u32>().ok()?;
    let d = parts[2].parse::<u32>().ok()?;
    Some((y, m, d))
}

/// Check if a year is a leap year
fn is_leap_year(y: i32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

/// Days in a given month/year
fn days_in_month(y: i32, m: u32) -> u32 {
    match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => if is_leap_year(y) { 29 } else { 28 },
        _ => 30,
    }
}

/// Convert (y, m, d) to a day number (for comparison and day-of-week)
/// Using a simplified Julian day calculation
fn to_day_number(y: i32, m: u32, d: u32) -> i64 {
    let y = y as i64;
    let m = m as i64;
    let d = d as i64;
    // Adjust for months Jan/Feb
    let (a, b) = if m <= 2 { (y - 1, m + 12) } else { (y, m) };
    365 * a + a / 4 - a / 100 + a / 400 + (153 * (b - 3) + 2) / 5 + d
}

/// Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
fn day_of_week(y: i32, m: u32, d: u32) -> u32 {
    // Zeller-like formula using day number
    let dn = to_day_number(y, m, d);
    // Calibrate: 2000-01-01 was a Saturday (6)
    let ref_dn = to_day_number(2000, 1, 1);
    let diff = dn - ref_dn;
    ((diff % 7 + 7 + 6) % 7) as u32
}

/// Format (y, m, d) as "YYYY-MM-DD"
fn format_date(y: i32, m: u32, d: u32) -> String {
    format!("{:04}-{:02}-{:02}", y, m, d)
}

/// Add days to a date
fn add_days(y: i32, m: u32, d: u32, days: i32) -> (i32, u32, u32) {
    let mut y = y;
    let mut m = m;
    let mut d = d as i32 + days;

    while d > days_in_month(y, m) as i32 {
        d -= days_in_month(y, m) as i32;
        m += 1;
        if m > 12 {
            m = 1;
            y += 1;
        }
    }
    while d < 1 {
        m -= 1;
        if m < 1 {
            m = 12;
            y -= 1;
        }
        d += days_in_month(y, m) as i32;
    }
    (y, m, d as u32)
}

/// Add months to a date (clamping day to max days in target month)
fn add_months(y: i32, m: u32, d: u32, months: i32) -> (i32, u32, u32) {
    let total_months = (y * 12 + m as i32 - 1) + months;
    let new_y = total_months.div_euclid(12);
    let new_m = (total_months.rem_euclid(12) + 1) as u32;
    let max_d = days_in_month(new_y, new_m);
    let new_d = d.min(max_d);
    (new_y, new_m, new_d)
}

/// Core: calculate occurrences of a recurring schedule within a range
fn calculate_occurrences_impl(
    input: &RecurrenceInput,
    range_start: &str,
    range_end: &str,
) -> Vec<String> {
    let (rs_y, rs_m, rs_d) = match parse_date(range_start) {
        Some(v) => v,
        None => return vec![],
    };
    let (re_y, re_m, re_d) = match parse_date(range_end) {
        Some(v) => v,
        None => return vec![],
    };
    let (mut cy, mut cm, mut cd) = match parse_date(&input.start_date) {
        Some(v) => v,
        None => return vec![],
    };

    let range_start_dn = to_day_number(rs_y, rs_m, rs_d);
    let range_end_dn = to_day_number(re_y, re_m, re_d);

    let recurrence_end_dn = input.end_date.as_ref().and_then(|s| {
        parse_date(s).map(|(y, m, d)| to_day_number(y, m, d))
    });

    // Build excluded set (O(1) lookup via HashSet)
    let excluded: HashSet<&str> = input.excluded_dates.iter().map(|s| s.as_str()).collect();

    let interval = input.interval.max(1) as i32;
    let days_of_week_set: HashSet<u32> = input.days_of_week.iter().copied().collect();
    let max_occ = input.max_occurrences.unwrap_or(u32::MAX);

    let mut results: Vec<String> = Vec::new();

    // For weekly with daysOfWeek, we iterate day by day within each week-interval
    let is_weekly_with_days = input.frequency == "weekly" && !days_of_week_set.is_empty();

    // Remember original day for monthly/yearly to handle clamping correctly
    let original_day = cd;

    if is_weekly_with_days {
        // Align to the start of the week (Sunday) of start_date
        let start_dow = day_of_week(cy, cm, cd);
        let (mut wy, mut wm, mut wd) = if start_dow > 0 {
            add_days(cy, cm, cd, -(start_dow as i32))
        } else {
            (cy, cm, cd)
        };

        loop {
            // Check each day in this week
            for dow in 0..7u32 {
                let (dy, dm, dd) = add_days(wy, wm, wd, dow as i32);
                let dn = to_day_number(dy, dm, dd);

                if dn < to_day_number(cy, cm, cd) {
                    continue; // before start_date
                }
                if dn > range_end_dn {
                    return results;
                }
                if let Some(end) = recurrence_end_dn {
                    if dn > end {
                        return results;
                    }
                }
                if results.len() as u32 >= max_occ {
                    return results;
                }

                if dn >= range_start_dn && days_of_week_set.contains(&dow) {
                    let date_str = format_date(dy, dm, dd);
                    if !excluded.contains(date_str.as_str()) {
                        results.push(date_str);
                    }
                }
            }

            // Jump by interval weeks
            let (ny, nm, nd) = add_days(wy, wm, wd, interval * 7);
            wy = ny;
            wm = nm;
            wd = nd;
        }
    } else {
        // Standard: daily, weekly (no specific days), monthly, yearly
        loop {
            let current_dn = to_day_number(cy, cm, cd);

            if current_dn > range_end_dn {
                break;
            }
            if let Some(end) = recurrence_end_dn {
                if current_dn > end {
                    break;
                }
            }
            if results.len() as u32 >= max_occ {
                break;
            }

            if current_dn >= range_start_dn {
                // For monthly with dayOfMonth, check if current day matches
                let include = match input.frequency.as_str() {
                    "monthly" => {
                        if let Some(dom) = input.day_of_month {
                            let max_d = days_in_month(cy, cm);
                            cd == dom.min(max_d)
                        } else {
                            true
                        }
                    }
                    _ => true,
                };

                if include {
                    let date_str = format_date(cy, cm, cd);
                    if !excluded.contains(date_str.as_str()) {
                        results.push(date_str);
                    }
                }
            }

            // Advance to next occurrence
            match input.frequency.as_str() {
                "daily" => {
                    let (ny, nm, nd) = add_days(cy, cm, cd, interval);
                    cy = ny;
                    cm = nm;
                    cd = nd;
                }
                "weekly" => {
                    let (ny, nm, nd) = add_days(cy, cm, cd, interval * 7);
                    cy = ny;
                    cm = nm;
                    cd = nd;
                }
                "monthly" => {
                    let target_day = input.day_of_month.unwrap_or(original_day);
                    let (ny, nm, _) = add_months(cy, cm, cd, interval);
                    cy = ny;
                    cm = nm;
                    cd = target_day.min(days_in_month(cy, cm));
                }
                "yearly" => {
                    let (ny, nm, _) = add_months(cy, cm, cd, interval * 12);
                    cy = ny;
                    cm = nm;
                    cd = original_day.min(days_in_month(cy, cm));
                }
                _ => break,
            }
        }
    }

    results
}

#[wasm_bindgen]
pub fn calculate_occurrences(input_js: JsValue, range_start: &str, range_end: &str) -> JsValue {
    let input: RecurrenceInput = match serde_wasm_bindgen::from_value(input_js) {
        Ok(v) => v,
        Err(_) => {
            let empty = OccurrenceResult { dates: vec![] };
            return serde_wasm_bindgen::to_value(&empty).unwrap();
        }
    };

    let dates = calculate_occurrences_impl(&input, range_start, range_end);
    let result = OccurrenceResult { dates };
    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_input(
        frequency: &str,
        interval: u32,
        start_date: &str,
        end_date: Option<&str>,
        excluded: Vec<&str>,
        days_of_week: Vec<u32>,
        day_of_month: Option<u32>,
        max_occurrences: Option<u32>,
    ) -> RecurrenceInput {
        RecurrenceInput {
            frequency: frequency.to_string(),
            interval,
            start_date: start_date.to_string(),
            end_date: end_date.map(|s| s.to_string()),
            max_occurrences,
            excluded_dates: excluded.into_iter().map(|s| s.to_string()).collect(),
            days_of_week,
            day_of_month,
        }
    }

    #[test]
    fn test_daily() {
        let input = make_input("daily", 1, "2025-01-01", None, vec![], vec![], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-01-05");
        assert_eq!(result, vec!["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05"]);
    }

    #[test]
    fn test_daily_interval() {
        let input = make_input("daily", 2, "2025-01-01", None, vec![], vec![], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-01-07");
        assert_eq!(result, vec!["2025-01-01", "2025-01-03", "2025-01-05", "2025-01-07"]);
    }

    #[test]
    fn test_daily_excluded() {
        let input = make_input("daily", 1, "2025-01-01", None, vec!["2025-01-03"], vec![], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-01-05");
        assert_eq!(result, vec!["2025-01-01", "2025-01-02", "2025-01-04", "2025-01-05"]);
    }

    #[test]
    fn test_weekly() {
        let input = make_input("weekly", 1, "2025-01-06", None, vec![], vec![], None, None); // Monday
        let result = calculate_occurrences_impl(&input, "2025-01-06", "2025-01-27");
        assert_eq!(result, vec!["2025-01-06", "2025-01-13", "2025-01-20", "2025-01-27"]);
    }

    #[test]
    fn test_weekly_with_days() {
        // Mon=1, Wed=3, Fri=5
        let input = make_input("weekly", 1, "2025-01-06", None, vec![], vec![1, 3, 5], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-06", "2025-01-12");
        assert_eq!(result, vec!["2025-01-06", "2025-01-08", "2025-01-10"]);
    }

    #[test]
    fn test_monthly() {
        let input = make_input("monthly", 1, "2025-01-15", None, vec![], vec![], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-04-30");
        assert_eq!(result, vec!["2025-01-15", "2025-02-15", "2025-03-15", "2025-04-15"]);
    }

    #[test]
    fn test_monthly_day_of_month() {
        let input = make_input("monthly", 1, "2025-01-31", None, vec![], vec![], Some(31), None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-04-30");
        // Feb has 28 days, so 31 clamps to 28
        assert_eq!(result, vec!["2025-01-31", "2025-02-28", "2025-03-31", "2025-04-30"]);
    }

    #[test]
    fn test_yearly() {
        let input = make_input("yearly", 1, "2024-02-29", None, vec![], vec![], None, None); // leap day
        let result = calculate_occurrences_impl(&input, "2024-01-01", "2028-12-31");
        // 2024 leap, 2025 not (Feb 28), 2026 not, 2027 not, 2028 leap
        assert_eq!(result, vec!["2024-02-29", "2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"]);
    }

    #[test]
    fn test_max_occurrences() {
        let input = make_input("daily", 1, "2025-01-01", None, vec![], vec![], None, Some(3));
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-12-31");
        assert_eq!(result, vec!["2025-01-01", "2025-01-02", "2025-01-03"]);
    }

    #[test]
    fn test_recurrence_end_date() {
        let input = make_input("daily", 1, "2025-01-01", Some("2025-01-03"), vec![], vec![], None, None);
        let result = calculate_occurrences_impl(&input, "2025-01-01", "2025-12-31");
        assert_eq!(result, vec!["2025-01-01", "2025-01-02", "2025-01-03"]);
    }
}
