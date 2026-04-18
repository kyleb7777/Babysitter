import { DAYS, coerceWeekly, type WeeklyAvailability } from "@/lib/availability";

export function AvailabilityFields({ value }: { value?: WeeklyAvailability | null }) {
  const weekly = coerceWeekly(value ?? {});
  return (
    <div className="availGrid">
      {DAYS.map(({ key, label }) => {
        const day = weekly[key]!;
        return (
          <label key={key} className={`availRow ${day.enabled ? "" : "off"}`}>
            <span className="pill">
              <input
                type="checkbox"
                name={`avail_${key}_enabled`}
                defaultChecked={day.enabled}
              />
              <span className="dayLabel">{label}</span>
            </span>
            <input
              type="time"
              name={`avail_${key}_start`}
              defaultValue={day.start}
              aria-label={`${label} start`}
            />
            <span className="toLabel">to</span>
            <input
              type="time"
              name={`avail_${key}_end`}
              defaultValue={day.end}
              aria-label={`${label} end`}
            />
            <span className="pill">
              <input
                type="checkbox"
                name={`avail_${key}_flexible`}
                defaultChecked={day.flexible}
              />
              flexible
            </span>
          </label>
        );
      })}
    </div>
  );
}
