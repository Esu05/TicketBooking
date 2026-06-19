import styles from "./SeatGrid.module.css";

export default function SeatGrid({
  seats,
  selectedSeats,
  onToggle,
  disabledSeats = [],
}) {
  const rows = seats.reduce((acc, seat) => {
    const row = seat.seatNumber[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  return (
    <div className={styles.wrapper}>
      <div className={styles.stage}>STAGE</div>
      <div className={styles.seatingArea}>
      <div className={styles.grid}>
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className={styles.row}>
            <span className={styles.rowLabel}>{row}</span>
            <div className={styles.seats}>
              {[...rowSeats]
                .sort((a, b) => {
                  const numA = parseInt(a.seatNumber.slice(1), 10);
                  const numB = parseInt(b.seatNumber.slice(1), 10);
                  return numA - numB;
                })
                .map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  const isDisabled =
                    seat.status !== "available" ||
                    disabledSeats.includes(seat.seatNumber);

                  let cls = styles.seat;
                  if (isSelected) cls += " " + styles.selected;
                  else if (seat.status === "reserved")
                    cls += " " + styles.reserved;
                  else if (seat.status === "booked") cls += " " + styles.booked;
                  else cls += " " + styles.available;
                  if (isDisabled && !isSelected) cls += " " + styles.disabled;

                  return (
                    <button
                      key={seat.seatNumber}
                      className={cls}
                      onClick={() => !isDisabled && onToggle(seat.seatNumber)}
                      title={`${seat.seatNumber} — ${seat.status}`}
                      disabled={isDisabled && !isSelected}
                    >
                      {seat.seatNumber.slice(1)}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className={styles.legend}>
        <LegendItem color="available" label="Available" />
        <LegendItem color="selected" label="Selected" />
        <LegendItem color="reserved" label="Reserved" />
        <LegendItem color="booked" label="Booked" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={`${styles.dot} ${styles[color]}`} />
      <span>{label}</span>
    </div>
  );
}
