"use client";

import Logo, { LogoWithBackground, SimpleRoundLogo } from "./Logo";

export default function LogoDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">
          TaDa Logo Variants
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Default Logo */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Default Logo
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Logo size="sm" />
                <span className="text-sm text-slate-600">Small (32px)</span>
              </div>
              <div className="flex items-center gap-4">
                <Logo size="md" />
                <span className="text-sm text-slate-600">Medium (48px)</span>
              </div>
              <div className="flex items-center gap-4">
                <Logo size="lg" />
                <span className="text-sm text-slate-600">Large (64px)</span>
              </div>
              <div className="flex items-center gap-4">
                <Logo size="xl" />
                <span className="text-sm text-slate-600">
                  Extra Large (80px)
                </span>
              </div>
            </div>
          </div>

          {/* Logo with Background */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              With Background
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <LogoWithBackground size="sm" />
                <span className="text-sm text-slate-600">Small</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoWithBackground size="md" />
                <span className="text-sm text-slate-600">Medium</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoWithBackground size="lg" />
                <span className="text-sm text-slate-600">Large</span>
              </div>
              <div className="flex items-center gap-4">
                <LogoWithBackground size="xl" />
                <span className="text-sm text-slate-600">Extra Large</span>
              </div>
            </div>
          </div>

          {/* Simple Round Logo */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Simple Round
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <SimpleRoundLogo size="sm" />
                <span className="text-sm text-slate-600">Small</span>
              </div>
              <div className="flex items-center gap-4">
                <SimpleRoundLogo size="md" />
                <span className="text-sm text-slate-600">Medium</span>
              </div>
              <div className="flex items-center gap-4">
                <SimpleRoundLogo size="lg" />
                <span className="text-sm text-slate-600">Large</span>
              </div>
              <div className="flex items-center gap-4">
                <SimpleRoundLogo size="xl" />
                <span className="text-sm text-slate-600">Extra Large</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Usage Examples
          </h2>

          {/* Header Example */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Header/Navigation
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <Logo size="md" />
              </div>
            </div>
          </div>

          {/* Landing Page Example */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Landing Page Hero
            </h3>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 text-center">
              <div className="flex items-center justify-center mb-4">
                <Logo size="xl" className="mr-6" />
                <h1 className="text-4xl font-bold text-slate-900">TaDa</h1>
              </div>
              <p className="text-slate-600">Where Home Finds You!</p>
            </div>
          </div>

          {/* Different Backgrounds */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              On Different Backgrounds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-6 text-center">
                <Logo size="lg" className="mx-auto mb-2" />
                <p className="text-white text-sm">Dark Background</p>
              </div>
              <div className="bg-blue-600 rounded-lg p-6 text-center">
                <LogoWithBackground size="lg" className="mx-auto mb-2" />
                <p className="text-white text-sm">Colored Background</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-center">
                <SimpleRoundLogo size="lg" className="mx-auto mb-2" />
                <p className="text-white text-sm">Gradient Background</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-slate-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-white mb-4">
            Code Examples
          </h2>
          <div className="space-y-4 text-sm">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-300 mb-2">Default Logo:</p>
              <code className="text-green-400">
                {`<Logo size="md" onClick={() => router.push('/')} />`}
              </code>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-300 mb-2">Logo with Background:</p>
              <code className="text-green-400">
                {`<LogoWithBackground size="lg" className="custom-class" />`}
              </code>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-300 mb-2">Simple Round Logo:</p>
              <code className="text-green-400">
                {`<SimpleRoundLogo size="sm" />`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
