export type PoliticalEvidence={party:'Republican'|'Democrat';date:string;kind:string;text:string;source:string;amountUsd?:number}
// Historical, individually sourced events. Not party membership or a complete giving total.
export const politicalEvidence:Record<string,PoliticalEvidence[]>={
 'elon-musk':[{party:'Republican',date:'2024-07-13',kind:'媒体记录·公开背书',text:'公开支持特朗普参加2024年总统选举。',source:'https://www.investing.com/news/economy-news/elon-musk-says-he-fully-endorses-tough-trump-posts-photo-3518181'}],
 'michael-bloomberg':[{party:'Democrat',date:'2024-10-31',kind:'媒体记录·公开背书',text:'公开表示投票支持哈里斯。只反映该次选举，不代表历年党籍。',source:'https://elections2024.thehill.com/news/michael-bloomberg-endorses-harris-i-voted-for-her-without-hesitation'}],
 'melinda-french-gates':[{party:'Democrat',date:'2024-07-25',kind:'本人受访·公开背书',text:'在CBS采访中支持哈里斯参加2024年总统选举。',source:'https://www.cbsnews.com/news/melinda-french-gates-endorses-harris-new-youtube-project-highlights-women-trailblazers/'}],
 'vinod-khosla':[{party:'Democrat',date:'2024-07-31',kind:'媒体记录·公开背书',text:'参与支持哈里斯的VC公开倡议。',source:'https://www.geekwire.com/2024/mark-cuban-reid-hoffman-vinod-khosla-sign-vcsforkamala-pledge-started-by-seattle-investor/'}],
 'bill-gates':[{party:'Democrat',date:'2024-10-23',kind:'媒体报道·金额未与申报对应',text:'报道指向支持哈里斯的组织捐款；不是FEC逐笔核算总额，不能与其他报道重复相加。',source:'https://www.theguardian.com/us-news/2024/oct/23/bill-gates-donates-millions-kamala-harris-campaign-election',amountUsd:50000000}]
}
export const partyText=(p:string)=>p==='Republican'?'共和党相关':p==='Democrat'?'民主党相关':'其他'
export function politicalLabel(id:string){const e=politicalEvidence[id]||[];if(!e.length)return '暂无资料';const parties=new Set(e.map(x=>x.party));return parties.size>1?'双向·历史记录':`${e[0].party==='Republican'?'共和党':'民主党'}·2024记录`}
