import React, { useState } from "react";
import BarChartComponent from "./BarChart";
import AreaChartComponent from "./AreaChart";
import Wrapper from "../assets/wrappers/ChartsContainer";
import { useAppContext } from "../context/appContext.js";

const ChartsContainer = () => {
  const [barChart, setBarChart] = useState(true);
  const { monthlyApplications: data } = useAppContext();

  return (
    <Wrapper>
      <h4>Monthly Applications</h4>
      <button type="button" onClick={() => setBarChart(!barChart)}>
        { barChart? 'Area Chart' : 'BarChart' }
      </button>
      {barChart? <BarChartComponent data={data} /> : <AreaChartComponent data={data} /> }
    </Wrapper>
  );
};

export default ChartsContainer;

/*

import React, { useState } from 'react'

import BarChart from './BarChart'
import AreaChart from './AreaChart'
import { useAppContext } from '../context/appContext'
import Wrapper from '../assets/wrappers/ChartsContainer'

export default function ChartsContainer() {
  const [barChart, setBarChart] = useState(true)
  const { monthlyApplications: data } = useAppContext()

  return (
    <Wrapper>
      <h4>Monthly Applications</h4>

      <button type='button' onClick={() => setBarChart(!barChart)}>
        {barChart ? 'AreaChart' : 'BarChart'}
      </button>
      {barChart ? <BarChart data={data} /> : <AreaChart data={data} />}
    </Wrapper>
  )
}


*/
