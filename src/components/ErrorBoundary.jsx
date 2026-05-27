import React from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('TKV render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container error-boundary">
          <h1>Une erreur est survenue</h1>
          <p className="text-muted">
            L&apos;application a rencontré un problème. Rechargez la page ou revenez à l&apos;accueil.
          </p>
          <div className="error-boundary-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recharger
            </button>
            <Link to="/" className="btn btn-outline">
              Accueil
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
