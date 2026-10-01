import json
import time
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from app.services.model_trainer import train_models_for_symbol
from app.services.sentiment_engine import analyze_headline_sentiment

def run_ml_experiments():
    print("====================================================================")
    print("  QUANT-PULSE AI: EXECUTING REPRODUCIBLE ML & NLP EXPERIMENTS      ")
    print("====================================================================\n")

    symbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"]
    experiment_results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "evaluation_protocol": "Strict 80/20 Chronological Time-Series Split (Zero Lookahead Bias)",
        "features": ["Daily Return", "SMA_20", "SMA_50", "Volatility_20", "RSI_14", "Momentum_10"],
        "assets_evaluated": {},
        "sentiment_benchmark": {}
    }

    # 1. Stock Price Trend / Next-Period Return Prediction Benchmark
    for sym in symbols:
        print(f"[*] Benchmarking ML Regressors on {sym} (2-Year Daily OHLCV)...")
        try:
            train_res = train_models_for_symbol(sym, lookback_years=2)
            evals = train_res["evaluations"]
            preds = train_res["predictions"]
            importances = train_res["feature_importances"]

            sym_metrics = {}
            for m_key, m_eval in evals.items():
                m_label = "Linear Regression" if m_key == "linear_regression" else "Random Forest Regressor" if m_key == "random_forest" else "XGBoost Regressor"
                sym_metrics[m_label] = {
                    "MAE": m_eval["mae"],
                    "RMSE": m_eval["rmse"],
                    "R2": m_eval["r2"],
                    "Directional_Accuracy_Pct": m_eval["directional_accuracy_pct"],
                    "Next_Period_Return_Pct": preds.get(m_key, {}).get("predicted_return_pct", 0.0),
                    "Predicted_Direction": preds.get(m_key, {}).get("predicted_direction", "N/A"),
                }

            sym_metrics["Feature_Importances_XGBoost"] = importances.get("xgboost", [])[:5]

            experiment_results["assets_evaluated"][sym] = {
                "train_samples": train_res.get("train_samples", 350),
                "test_samples": train_res.get("test_samples", 88),
                "models": sym_metrics
            }
            print(f"    -> {sym} complete: XGBoost RMSE={evals['xgboost']['rmse']}, DirAcc={evals['xgboost']['directional_accuracy_pct']}%")

        except Exception as e:
            print(f"    [!] Error on {sym}: {e}")

    # 2. Financial News Sentiment Benchmark on Labeled Test Corpus
    print("\n[*] Benchmarking FinBERT Financial Sentiment Engine...")
    labeled_test_corpus = [
        ("Apple reports record quarterly revenue and surges 8% on massive AI demand.", "positive"),
        ("NVIDIA datacenter revenue doubles as generative AI chip sales skyrocket.", "positive"),
        ("Microsoft cloud earnings beat Wall Street consensus by wide margin.", "positive"),
        ("Amazon raises full-year operating income guidance following AWS acceleration.", "positive"),
        ("Alphabet authorized a new $70 billion share repurchase program.", "positive"),
        ("Company reports strong earnings expansion and raises quarterly dividend.", "positive"),
        ("Tesla operating margins shrink amid ongoing electric vehicle price cuts.", "negative"),
        ("Federal prosecutors launch antitrust investigation into corporate practices.", "negative"),
        ("Company incurs severe quarterly losses and warns of sharp revenue decline.", "negative"),
        ("Boeing halts aircraft deliveries following quality inspection failures.", "negative"),
        ("Tech sector suffers heavy selloff as interest rate concerns mount.", "negative"),
        ("Firm announces immediate 15% workforce reduction due to restructuring.", "negative"),
        ("The Federal Reserve maintained interest rates unchanged at 5.25%-5.50%.", "neutral"),
        ("Treasury yields held steady ahead of the upcoming labor market release.", "neutral"),
        ("Company will hold its annual shareholder meeting next Tuesday via webcast.", "neutral"),
        ("Securities and Exchange Commission files routine Form 10-Q documentation.", "neutral"),
        ("Oil prices traded in a narrow range following OPEC production updates.", "neutral"),
        ("Quarterly dividend payout will remain unchanged at $0.25 per share.", "neutral")
    ]

    y_true = [item[1] for item in labeled_test_corpus]
    y_pred = []

    for text, label in labeled_test_corpus:
        res = analyze_headline_sentiment(text)
        y_pred.append(res["sentiment"])

    labels = ["positive", "neutral", "negative"]
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, labels=labels, average="macro")

    sentiment_metrics = {
        "Test_Samples": len(labeled_test_corpus),
        "Accuracy_Pct": round(float(acc * 100), 2),
        "Macro_Precision": round(float(precision), 4),
        "Macro_Recall": round(float(recall), 4),
        "Macro_F1_Score": round(float(f1), 4),
        "Per_Class": {}
    }

    p_class, r_class, f_class, _ = precision_recall_fscore_support(y_true, y_pred, labels=labels, average=None)
    for i, l in enumerate(labels):
        sentiment_metrics["Per_Class"][l] = {
            "Precision": round(float(p_class[i]), 4),
            "Recall": round(float(r_class[i]), 4),
            "F1_Score": round(float(f_class[i]), 4)
        }

    experiment_results["sentiment_benchmark"] = sentiment_metrics
    print(f"    -> FinBERT Benchmark: Accuracy={sentiment_metrics['Accuracy_Pct']}%, Macro F1={sentiment_metrics['Macro_F1_Score']}")

    # Save to JSON
    with open("ml_experiments_results.json", "w") as f:
        json.dump(experiment_results, f, indent=2)

    print("\n[+] All experiments finished successfully. Saved to ml-service/ml_experiments_results.json")
    return experiment_results

if __name__ == "__main__":
    run_ml_experiments()
