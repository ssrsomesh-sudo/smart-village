function StatsCard({ icon, title, value, bgColor = "primary", textColor = "white" }) {
  return (
    <div className="col-md-4 col-lg-2 mb-3">
      <div className={`card shadow-sm border-0 bg-${bgColor} text-${textColor}`}>
        <div className="card-body text-center">
          <div style={{ fontSize: "2rem" }}>{icon}</div>
          <h3 className="mt-2 mb-1">{value}</h3>
          <p className="mb-0 small">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default StatsCard;