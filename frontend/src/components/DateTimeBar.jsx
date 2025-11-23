import React, { useEffect, useState } from "react";

const DateTimeBar = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format in 12-hour hh:mm:ss AM/PM
  const formattedTime = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = dateTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: "100%",
        background: "#f5f5f5",
        padding: "6px 12px",
        fontSize: "14px",
        fontWeight: "bold",
        borderBottom: "1px solid #ddd",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        textAlign: "right",
      }}
    >
      {formattedDate} • {formattedTime}
    </div>
  );
};

export default DateTimeBar;