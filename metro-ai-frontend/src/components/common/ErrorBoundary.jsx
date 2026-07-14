import { Component } from 'react';
import { RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('METRO AI crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center px-6">
          <div className="glass-panel p-8 max-w-sm text-center">
            <p className="font-display text-xl text-slate-100 mb-2">Something went sideways</p>
            <p className="text-sm text-slate-400 mb-6">
              The app hit an unexpected error. A refresh usually clears it up.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold py-2.5 px-5"
            >
              <RefreshCcw size={16} /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
