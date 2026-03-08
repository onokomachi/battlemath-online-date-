
import React, { useState } from 'react';
import type { SessionStats } from '../types';
import MenuScreen from './MenuScreen';
import ProblemScreen from './ProblemScreen';
import RecordsScreen from './RecordsScreen';
import { saveRecord } from '../services/recordService';

interface PracticeModeProps {
  onSessionComplete: (score: number) => void;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ onSessionComplete }) => {
  const [screen, setScreen] = useState<'menu' | 'problem' | 'records'>('menu');
  const [selectedTopic, setSelectedTopic] = useState<{ category: string; subTopic: string } | null>(null);
  const [overallStats, setOverallStats] = useState<SessionStats>({ correct: 0, incorrect: 0, totalScore: 0, problemCount: 0 });

  const handleSelectSubTopic = (category: string, subTopic: string) => {
    setSelectedTopic({ category, subTopic });
    setScreen('problem');
  };

  const handleShowRecords = () => {
    setScreen('records');
  };

  const handleProblemSessionBack = (stats: SessionStats) => {
    if (selectedTopic && stats.problemCount > 0) {
        saveRecord({
            category: selectedTopic.category,
            subTopic: selectedTopic.subTopic,
            stats: stats
        });
        setOverallStats(prev => ({
            correct: prev.correct + stats.correct,
            incorrect: prev.incorrect + stats.incorrect,
            totalScore: prev.totalScore + stats.totalScore,
            problemCount: prev.problemCount + stats.problemCount,
        }));
    }
    setScreen('menu');
    setSelectedTopic(null);
  };

  const handleGoHome = () => {
    // 問題を解いている途中でホームに戻る場合
    onSessionComplete(overallStats.totalScore);
  };

  if (screen === 'problem' && selectedTopic) {
    return (
      <ProblemScreen
        category={selectedTopic.category}
        subTopic={selectedTopic.subTopic}
        onBack={handleProblemSessionBack}
        onHome={handleGoHome}
      />
    );
  }
  
  if (screen === 'records') {
      return <RecordsScreen onBackToMenu={() => setScreen('menu')} />
  }

  return (
    <MenuScreen
      onSelectSubTopic={handleSelectSubTopic}
      onShowRecords={handleShowRecords}
      onExit={handleGoHome}
    />
  );
};

export default PracticeMode;
