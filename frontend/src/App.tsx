import { PoliticalRadar } from './components/PoliticalRadar'

// 公开版入口：只包含政治人物交易雷达，不含本机版的多市场工作台（交易机器人）。
export default function App() {
  return <PoliticalRadar/>
}
