import { useState } from "react";
import { useForm } from "react-hook-form";
import { mlApi, MLQuoteResponse, RiskAssessmentResponse } from "../services/api";
import styles from "./SecurityQuote.module.css";

const EVENT_TYPES = [
  { value: "corporate", label: "Corporate Event" },
  { value: "concert", label: "Concert / Festival" },
  { value: "sports", label: "Sporting Event" },
  { value: "private", label: "Private Event" },
  { value: "construction", label: "Construction Site" },
  { value: "retail", label: "Retail Security" },
  { value: "residential", label: "Residential" },
];

type FormData = {
  eventType: string;
  locationZip: string;
  numGuards: number;
  hours: number;
  eventDate: string;
  eventTime: string;
  crowdSize: number;
  isArmed: boolean;
  requiresVehicle: boolean;
};

export default function SecurityQuote() {
  const [quote, setQuote] = useState<MLQuoteResponse | null>(null);
  const [risk, setRisk] = useState<RiskAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      eventType: "corporate",
      locationZip: "90001",
      numGuards: 2,
      hours: 4,
      crowdSize: 100,
      isArmed: false,
      requiresVehicle: false,
    },
  });

  const formValues = watch();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const eventDateTime = `${data.eventDate}T${data.eventTime}:00`;

      const [quoteResult, riskResult] = await Promise.all([
        mlApi.getQuotePrediction({
          eventType: data.eventType,
          locationZip: data.locationZip,
          numGuards: data.numGuards,
          hours: data.hours,
          eventDate: eventDateTime,
          crowdSize: data.crowdSize,
          isArmed: data.isArmed,
          requiresVehicle: data.requiresVehicle,
        }),
        mlApi.getRiskAssessment({
          eventType: data.eventType,
          locationZip: data.locationZip,
          numGuards: data.numGuards,
          hours: data.hours,
          eventDate: eventDateTime,
          crowdSize: data.crowdSize,
          isArmed: data.isArmed,
          requiresVehicle: data.requiresVehicle,
        }),
      ]);

      setQuote(quoteResult);
      setRisk(riskResult);
    } catch (err) {
      setError("Failed to get quote. Make sure the ML engine is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "#4caf50";
      case "medium": return "#ff9800";
      case "high": return "#f44336";
      case "critical": return "#9c27b0";
      default: return "#666";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <h1 className={styles.title}>Security Guard Quote</h1>
        <p className={styles.subtitle}>
          Get an ML-powered price estimate for your security needs
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Event Type</label>
            <select {...register("eventType")}>
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Location (ZIP)</label>
              <input
                type="text"
                maxLength={5}
                {...register("locationZip")}
              />
            </div>
            <div className={styles.field}>
              <label>Expected Crowd</label>
              <input
                type="number"
                min={0}
                {...register("crowdSize", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Number of Guards</label>
              <input
                type="number"
                min={1}
                max={50}
                {...register("numGuards", { valueAsNumber: true })}
              />
            </div>
            <div className={styles.field}>
              <label>Hours Needed</label>
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                {...register("hours", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Event Date</label>
              <input type="date" {...register("eventDate")} />
            </div>
            <div className={styles.field}>
              <label>Start Time</label>
              <input type="time" {...register("eventTime")} />
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input type="checkbox" {...register("isArmed")} />
              <span>Armed Guards (+$15/hr per guard)</span>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" {...register("requiresVehicle")} />
              <span>Vehicle Patrol (+$50/guard)</span>
            </label>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Calculating..." : "Get ML Quote"}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      {(quote || risk) && (
        <div className={styles.resultSection}>
          {quote && (
            <div className={styles.quoteCard}>
              <h2>Price Estimate</h2>
              <div className={styles.priceMain}>
                ${quote.final_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className={styles.priceDetails}>
                <div>
                  <span>Base Price</span>
                  <span>${quote.base_price.toFixed(2)}</span>
                </div>
                <div>
                  <span>Risk Multiplier</span>
                  <span>{quote.risk_multiplier.toFixed(2)}x</span>
                </div>
                <div>
                  <span>Confidence</span>
                  <span>{(quote.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className={styles.modelBadge}>
                Powered by {quote.breakdown.model_used}
              </div>
            </div>
          )}

          {risk && (
            <div className={styles.riskCard}>
              <h2>Risk Assessment</h2>
              <div
                className={styles.riskLevel}
                style={{ backgroundColor: getRiskColor(risk.risk_level) }}
              >
                {risk.risk_level.toUpperCase()}
              </div>
              <div className={styles.riskScore}>
                Risk Score: {(risk.risk_score * 100).toFixed(0)}%
              </div>

              <div className={styles.factorsList}>
                <h3>Risk Factors</h3>
                <ul>
                  {risk.factors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.recommendationsList}>
                <h3>Recommendations</h3>
                <ul>
                  {risk.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
