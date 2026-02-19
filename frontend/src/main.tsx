import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", color: "red", backgroundColor: "#fff5f5", border: "1px solid red", margin: "20px", borderRadius: "8px" }}>
                    <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
                    <p>{this.state.error?.message}</p>
                    <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>{this.state.error?.stack}</pre>
                    <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", cursor: "pointer" }}>Reload Page</button>
                </div>
            );
        }

        return this.props.children;
    }
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
