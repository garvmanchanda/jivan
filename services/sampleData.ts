import { Habit, Vital } from '../types';

// Sample habits to initialize for a profile
export const getSampleHabits = (): Habit[] => {
  const today = new Date().toISOString().split('T')[0];
  
  return [
    {
      id: '1',
      title: 'Track temperature tonight',
      completed: false,
      date: today,
    },
    {
      id: '2',
      title: 'Drink 3L water',
      completed: false,
      date: today,
    },
  ];
};

// Sample vitals for a profile
export const getSampleVitals = (): Vital[] => {
  const now = new Date().toISOString();
  
  return [
    {
      type: 'weight',
      value: 75,
      unit: 'kg',
      date: now,
      isDaily: false,
    },
    {
      type: 'height',
      value: 175,
      unit: 'cm',
      date: now,
      isDaily: false,
    },
    {
      type: 'age',
      value: 32,
      unit: 'years',
      date: now,
      isDaily: false,
    },
    {
      type: 'sleep',
      value: 7.3,
      unit: 'hrs',
      date: now,
      isDaily: true,
    },
    {
      type: 'water',
      value: 6,
      unit: 'glasses',
      date: now,
      isDaily: true,
    },
    {
      type: 'steps',
      value: 8500,
      unit: 'steps',
      date: now,
      isDaily: true,
    },
  ];
};

