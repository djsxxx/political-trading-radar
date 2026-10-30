// NGA current governor biographies checked individually 2026-10-26.
// Governor party only: never infer legislature control or election results.
export const governorSource='https://www.nga.org/governors/'
export const governorCheckedAt='2026-10-26'
export const governorParty:Record<string,string>={}
for(const code of 'AL AK AR FL GA ID IN IA LA MS MO MT NE NV NH ND OH OK SC SD TN TX UT VT WV WY'.split(' '))governorParty[code]='Republican'
for(const code of 'AZ CA CO CT DE HI IL KS KY ME MD MA MI MN NJ NM NY NC OR PA RI VA WA WI'.split(' '))governorParty[code]='Democrat'
export const governorPage=(englishState:string)=>`https://www.nga.org/governors/${englishState.toLowerCase().replaceAll(' ','-')}/`
