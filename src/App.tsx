/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ExpoGoShell } from './components/simulator/ExpoGoShell';

export default function App() {
  return (
    <LanguageProvider>
      <ExpoGoShell />
    </LanguageProvider>
  );
}
