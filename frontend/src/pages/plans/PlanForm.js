import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import PlanDetail from './PlanDetail';

// PlanForm reuses PlanDetail in create mode
export default function PlanForm() {
  return <PlanDetail createMode />;
}
