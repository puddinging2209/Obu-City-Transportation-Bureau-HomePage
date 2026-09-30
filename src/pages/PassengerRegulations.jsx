import React from 'react';

import SearchIcon from '@mui/icons-material/Search';
import {
	Alert,
	AlertTitle,
	Box,
	Container,
	Divider,
	InputAdornment,
	Link,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
	p: ({ children }) => (
		<Typography component='p' variant='body2' sx={{ lineHeight: 1.9, m: 0 }}>
			{children}
		</Typography>
	),
	table: ({ children }) => (
		<Box sx={{ my: 1, overflowX: 'auto' }}>
			<Table size='small' sx={{ minWidth: 320 }}>
				{children}
			</Table>
		</Box>
	),
	thead: ({ children }) => <TableHead>{children}</TableHead>,
	tbody: ({ children }) => <TableBody>{children}</TableBody>,
	tr: ({ children }) => <TableRow>{children}</TableRow>,
	th: ({ children }) => (
		<TableCell component='th' scope='col' sx={{ bgcolor: 'action.hover', fontWeight: 700, whiteSpace: 'nowrap' }}>
			{children}
		</TableCell>
	),
	td: ({ children }) => <TableCell>{children}</TableCell>,
};

const chapters = [
	{
		title: '第1章　総則',
		articles: [
			{
				title: '目的',
				paragraphs: [
					'この規則は、大府市営地下鉄（以下「地下鉄」といいます。）を利用する旅客の運送条件及び運送に付随する取扱いを定め、運送契約の内容を明らかにすることを目的とします。',
				],
			},
			{
				title: '適用範囲',
				paragraphs: [
					'旅客の運送については、法令等に別段の定めがある場合を除き、この規則を適用します。別に定める特別な運送条件がこの規則と異なるときは、その特別な定めによります。',
				],
			},
			{
				title: '用語',
				paragraphs: [
					'「乗車券類」とは、普通乗車券、定期乗車券その他地下鉄が旅客の運送のために発売する券をいいます。「旅客運賃」とは運送の対価を、「料金」とは運賃以外に特定の設備又はサービスについて収受する対価をいいます。',
				],
			},
			{
				title: '契約の成立',
				paragraphs: [
					'運送契約は、旅客が所定の運賃・料金を支払い、地下鉄が乗車券類を発売したときに成立します。乗車券類によらない運送については、所定の乗車手続が完了したときに成立します。',
				],
			},
			{
				title: '規則の変更',
				paragraphs: [
					'地下鉄は、法令の改正、運輸上の必要その他相当の事由がある場合、この規則を変更することがあります。変更後の規則及びその適用開始日は、ウェブサイトその他適切な方法でお知らせします。',
				],
			},
			{
				title: '運送の制限',
				paragraphs: [
					'天災、事故、施設の故障、感染症の拡大その他やむを得ない事由がある場合、安全確保又は運行維持のため、列車の運転、駅の利用又は乗車を制限することがあります。',
				],
			},
			{ title: '旅客への協力のお願い', paragraphs: ['旅客は、法令、この規則及び駅係員・乗務員の安全上必要な指示に従ってください。'] },
		],
	},
	{
		title: '第2章　乗車券類',
		articles: [
			{
				title: '乗車券類の種類',
				paragraphs: [
					'乗車券類の種類、発売区間、発売条件及び発売額は、別に定めるところによります。現在取り扱う券種及び利用条件は、発売箇所又は公式ウェブサイトで案内します。',
				],
			},
			{
				title: '特急券及びライナー券',
				paragraphs: [
					'特急券及びライナー券は、特急列車又はライナー列車の座席を指定するために発売する乗車券類です。旅客は、利用する列車及び座席に有効な券を所持し、係員の求めに応じて提示してください。',
					'特急券及びライナー券のみでは列車に乗車できません。別途利用区間に対応する乗車券または定期券をお求めください。',
				],
			},
			{
				title: '定期券',
				paragraphs: [
					'定期券は、券面に表示される経路および有効期間内で乗り降りが自由となる乗車券類です。',
					'経路の始点駅、終点駅を相互に乗り降りする場合に限り、券面に表示されていない経路を利用できます。',
				],
			},
			{
				title: '発売箇所及び発売方法',
				paragraphs: [
					'乗車券類は、駅の券売機、窓口その他地下鉄が指定する方法で発売します。発売時間、支払方法及び取扱券種は、発売箇所ごとに異なる場合があります。',
				],
			},
			{
				title: '購入及び所持',
				paragraphs: [
					'旅客は、乗車前に利用区間及び券種に合った乗車券類を購入し、運送終了まで所持してください。乗車券類は、券面又は購入時に示された条件に従って使用してください。',
				],
			},
			{
				title: '小児の取扱い',
				paragraphs: [
					'地下鉄では6歳以上12歳未満を小児として扱います。小児の運賃または乗車券類の料金は、大人の金額の半額とし、10円単位に切り上げます。ただし、ICカードを利用する場合は1円単位に切り上げます。',
				],
			},
			{
				title: '障害者割引',
				paragraphs: [
					'身体障害者とその介護者に対しては、運賃に対して1割の割引を行います。割引を受ける旅客は、地下鉄が指定する証明書等を提示してください。',
				],
			},
		],
	},
	{
		title: '第3章　運賃及び料金',
		articles: [
			{
				title: '運賃・料金の種類',
				paragraphs: [
					'運賃は普通旅客運賃及び定期旅客運賃を基本とします。特別な設備又はサービスを提供する場合の料金は、そのサービスの案内に定めます。\n\n| 種類 | 概要 |\n| --- | --- |\n| 普通旅客運賃 | 1回の乗車ごとに適用する運賃 |\n| 定期旅客運賃 | 券面に表示された区間・期間に適用する運賃 |',
				],
			},
			{
				title: '運賃の計算',
				paragraphs: [
					'普通旅客運賃は、乗車区間の営業キロが最短となる経路の営業キロにより計算し、旅客が実際に乗車する経路の営業キロによっては計算しません。乗車経路は、原則として同一の区間を重複して通らない一筆書きの経路に限ります。',
					'dを最短経路の営業キロとします。3kmまでは基本額170円とし、3kmを超える部分は距離帯ごとに次の額を加算します。表の上限額は各距離帯の加算を合計した基準額です。\n\n| 営業キロ帯 | その帯の距離1kmあたりの加算額 | 帯の上限までの累計基準額 |\n| --- | --- | --- |\n| 3km以下 | 加算なし | 170円 |\n| 3km超～10km以下 | 20円/km | 10kmで310円 |\n| 10km超～20km以下 | 18円/km | 20kmで490円 |\n| 20km超 | 15円/km | 上限なし（490円 + 20km超過分 × 15円） |\n\n例：15kmの場合、基準額は310円 + (15 − 10)km × 18円 = 400円です。\n\n普通運賃（現金）は10円単位で、IC運賃は基準額を1円単位に切り上げます。',
				],
			},
			{
				title: '運賃計算の特例',
				paragraphs: [
					'#### 分岐駅を通過する列車に乗車する場合の特例\n\n次の区間の左側の駅から枝分かれする一方の線区から他方の線区まで乗車する場合で、列車が左側の駅を通過するため右側の駅で乗り継ぎ、左側の駅と右側の駅との区間を重複して乗車する場合は、同区間の乗車は重複乗車とは認めないものとします。(左側の駅で直接乗り継いだものと見なす。)ただし、1乗車につき各区間1度ずつのみ認めます。\n\n与五八-太田川\n\n長土井-中田町\n\n駒場町西-宮腰\n\n末広-田面\n\n緒川植山-姥池',
				],
			},
			{
				title: '運賃の支払い',
				paragraphs: [
					'旅客は、乗車券類の購入時又は地下鉄が定める精算時に、運賃及び料金を支払ってください。乗車区間を変更した場合等は、所定の精算を行います。',
				],
			},
			{
				title: '通勤定期券',
				paragraphs: [
					'通勤定期券は、通勤その他の目的で、一定の区間を繰り返し乗車する旅客に発売します。購入時に利用区間及び使用開始日を指定し、券面に表示された区間及び有効期間内に限り使用できます。',
					'通勤定期券は券面に記載された旅客本人に限り、券面に表示された区間及び有効期間内で使用できます。',
					'発売する有効期間は1か月以上とし、1か月単位で発売します。購入月数をnか月、利用区間の普通旅客運賃をp円とすると、通勤定期運賃は`(18n + 12) × p`円です。',
				],
			},
			{
				title: '通学定期券',
				paragraphs: [
					'通学定期券は、指定された学校に通学する旅客が、自宅の最寄り駅と学校の最寄り駅との間を通学するために発売します。購入時に通学区間及び使用開始日を指定し、学校が発行する通学証明書その他地下鉄が指定する書類を提示してください。',
					'通学定期券は券面に記載された旅客本人に限り、券面に表示された区間及び有効期間内で使用できます。',
					'発売有効期間は1か月以上とし、1か月単位で発売します。購入月数をnか月、利用区間の普通旅客運賃をp円とすると、通学定期運賃は`(12n + 8) × p`円です。',
				],
			},
			{
				title: '運賃等の改定',
				paragraphs: [
					'運賃又は料金を改定するときは、適用日及び改定後の金額を事前に公表します。改定時に所持している乗車券類の取扱いは、改定の際に別に定めます。',
				],
			},
		],
	},
	{
		title: '第4章　乗車券類の効力',
		articles: [
			{
				title: '有効区間及び有効期間',
				paragraphs: [
					'乗車券類は、券面に表示された区間、期間、列車その他の使用条件の範囲内で有効です。表示のない事項は、購入時に示された条件によります。',
				],
			},
			{
				title: '改札及び提示',
				paragraphs: [
					'旅客は、乗車時に乗車券類を自動改札機に投入し、又は係員に提示してください。係員が確認を求めたときは、乗車券類を提示してください。',
				],
			},
			{
				title: '途中下車',
				paragraphs: [
					'途中下車の可否及び途中下車後の再乗車の条件は、乗車券類の種類及び券面表示によります。特に表示のない普通乗車券は、途中下車後の再乗車には使用できません。',
				],
			},
			{
				title: '乗車券類の紛失・汚損',
				paragraphs: [
					'乗車券類を紛失した場合又は券面表示を確認できなくなった場合は、その乗車券類を無効として回収することがあります。ただし磁気券は、磁気を読み取れる場合に限り、同じ効力の券類に交換します。',
				],
			},
			{
				title: '無効となる場合',
				paragraphs: [
					'券面表示に違反して使用した場合、他人名義の記名式乗車券を使用した場合、又は改変・偽造された乗車券類を使用した場合は、その乗車券類を無効として回収することがあります。',
				],
			},
		],
	},
	{
		title: '第5章　乗車変更及び払戻し',
		articles: [
			{
				title: '乗車変更',
				paragraphs: [
					'乗車区間、乗車日その他の変更は、乗車券類の使用開始前に1度のみ可能です。変更前と後との差額は、払い戻しまたは請求を行います。',
				],
			},
			{
				title: '旅行開始前の払戻し',
				paragraphs: [
					'旅行開始前の乗車券類は、有効期間内に所定の箇所で申し出た場合に限り、払戻しを行います。ただし払い戻し額は、発売額から手数料170円を引いた額になります。',
				],
			},
			{
				title: '旅行開始後の払戻し',
				paragraphs: ['原則としては、旅行開始後の乗車券類は払戻しを行いません。'],
			},
			{
				title: '定期券の払い戻し',
				paragraphs: ['定期券は、有効期間前に限り、払戻しを行います。定期券の払戻し額は、発売額から手数料170円を引いた額になります。'],
			},
			{
				title: '不正乗車',
				paragraphs: [
					'乗車券類を所持せずに乗車した場合又は不正に使用した場合は、乗車区間の運賃に加え、通常運賃の3倍の増運賃を収受することがあります。',
				],
			},
		],
	},
	{
		title: '第6章　運行不能及び遅延',
		articles: [
			{
				title: '運行不能時の案内',
				paragraphs: [
					'列車の運行に支障が生じた場合、地下鉄は駅、車内、公式ウェブサイトその他の方法で運行状況及び必要な案内をお知らせします。旅客は係員の案内に従ってください。',
				],
			},
			{
				title: '振替輸送',
				paragraphs: [
					'地下鉄は、運休又は運転見合わせにより必要と認めるときは、振替輸送を実施することがあります。振替輸送の対象となる乗車券、区間及び経路は、駅掲示又は当局ウェブサイトで指定します。',
					'旅客は、係員の案内に従い、対象となる乗車券を提示して指定経路を利用してください。指定外の経路を利用した場合、その区間の運賃は旅客の負担とします。',
				],
			},
			{
				title: '旅行の中止・中断',
				paragraphs: [
					'地下鉄線の運休が2時間以上継続し、旅客が旅行を中止したときは、所持する普通乗車券の未乗車区間に相当する額を、手数料を収受せずに払い戻します。振替輸送を利用して旅行を継続した場合は、払戻しを行いません。',
					'未乗車区間に相当する払戻額の算定方法及び払戻しの申出箇所は、別に定めます。',
				],
			},
			{
				title: '特急券・ライナー券の運休及び遅延',
				paragraphs: [
					'指定列車が運休した場合、旅客は、当局が指定する後続列車への変更又は当該特急券・ライナー券の全額払戻しを選択できます。払戻しに手数料はかかりません。後続列車への変更を選択した場合、当該券の払戻しは行いません。',
					'指定列車の到着が所定の到着時刻より2時間以上遅れた場合は、当該特急券・ライナー券の全額を、手数料を収受せずに払い戻します。',
					'特急券・ライナー券の払戻しは座席指定に係る料金に限ります。乗車券の払戻しは、普通乗車券の旅行中止に関する規定によります。',
				],
			},
			{
				title: '遅延時の取扱い',
				paragraphs: ['遅延によっては普通乗車券の払い戻しは行いません。遅延証明書はこのウェブサイト上に発行します。'],
			},
			{
				title: '地下鉄の責任',
				paragraphs: [
					'地下鉄は、法令に従い、運送に関して旅客に生じた損害を賠償します。ただし、地下鉄に責任のない事由による損害についてはこの限りではありません。',
				],
			},
		],
	},
	{
		title: '第7章　駅及び車内の取扱い',
		articles: [
			{
				title: '入場券',
				paragraphs: [
					'入場券は地下鉄線の各駅にて170円にて発売します。原則として発売から2時間のみ有効です。入場券で列車に乗車することはできません。',
				],
			},
			{
				title: '手回り品',
				paragraphs: [
					'旅客は、自己の責任で手回り品を管理し、他の旅客の迷惑又は運輸上の支障とならないようにしてください。駅係員または乗務員が危険性を認めた場合は、下車していただく場合があります。',
				],
			},
			{
				title: '持込禁止品',
				paragraphs: ['危険物、車内設備を損傷するおそれのある物品その他法令又は地下鉄が定める物品は、駅又は車内に持ち込むことができません。'],
			},
			{
				title: '迷惑行為等',
				paragraphs: [
					'旅客は、駅又は車内において、他の旅客や係員に危害・迷惑を及ぼす行為、施設・車両を損傷する行為、運行を妨げる行為をしてはなりません。',
				],
			},
		],
	},
	{
		title: '第8章　雑則',
		articles: [
			{
				title: '個人情報の取扱い',
				paragraphs: ['乗車券類の発売その他の手続で取得した個人情報は、地下鉄が公表するプライバシーポリシーに従って取り扱います。'],
			},
			{
				title: '準拠法及び管轄',
				paragraphs: [
					'この規則に定めのない事項は、関係法令及び一般の慣習によります。この規則に関して紛争が生じた場合の取扱いは、関係法令によります。',
				],
			},
		],
	},
];

function PassengerRegulations() {
	const [query, setQuery] = React.useState('');
	const normalizedQuery = query.trim().toLocaleLowerCase('ja');
	const visibleChapters = chapters
		.map((chapter) => ({
			...chapter,
			articles: chapter.articles.filter((article) =>
				`${article.title} ${article.paragraphs.join(' ')}`.toLocaleLowerCase('ja').includes(normalizedQuery),
			),
		}))
		.filter((chapter) => chapter.articles.length > 0);
	const pendingCount = chapters
		.flatMap((chapter) => chapter.articles)
		.reduce((count, article) => count + (article.paragraphs.join('').match(/【要設定：/g) ?? []).length, 0);

	function getArticleNumber(chapterIndex, articleIndex) {
		return chapters.slice(0, chapterIndex).reduce((count, chapter) => count + chapter.articles.length, articleIndex + 1);
	}

	function scrollToArticle(id) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	return (
		<Container maxWidth='lg' sx={{ py: { xs: 3, md: 5 } }}>
			<Stack spacing={3}>
				<Box>
					<Typography variant='overline' color='text.secondary' sx={{ fontWeight: 700 }}>
						OBU CITY SUBWAY / PASSENGER RULES
					</Typography>
					<Typography variant='h4' component='h1' sx={{ fontWeight: 700, mt: 0.5 }}>
						旅客営業規則
					</Typography>
					<Typography color='text.secondary' sx={{ mt: 1 }}>
						大府市営地下鉄の旅客運送に関する基本的な取扱いを定めます。
					</Typography>
				</Box>

				{pendingCount > 0 && (
					<Alert severity='warning' variant='outlined' sx={{ borderRadius: 1 }}>
						<AlertTitle sx={{ fontWeight: 700 }}>制定前の案内ページ</AlertTitle>
						この規則は架空の鉄道設定に基づく案です。運賃・料金、発売条件、払戻し等の未確定事項を含みます。正式な規則として適用する前に、
						{pendingCount}項目の「要設定」箇所を確定してください。
					</Alert>
				)}

				<TextField
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder='条文を検索'
					aria-label='条文を検索'
					size='small'
					sx={{ maxWidth: 520 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position='start'>
								<SearchIcon fontSize='small' />
							</InputAdornment>
						),
					}}
				/>

				<Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: '240px minmax(0, 1fr)', gap: 4, alignItems: 'start' }}>
					<Paper
						component='nav'
						aria-label='旅客営業規則の目次'
						variant='outlined'
						sx={{
							p: 2,
							borderRadius: 1,
							position: { md: 'sticky' },
							top: { md: 88 },
							maxHeight: { md: 'calc(100vh - 112px)' },
							overflowY: 'auto',
							mb: { xs: 3, md: 0 },
						}}
					>
						<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
							目次
						</Typography>
						<Stack spacing={0.5}>
							{visibleChapters.map((chapter) => {
								const chapterIndex = chapters.findIndex((item) => item.title === chapter.title);
								return (
									<Box key={chapter.title}>
										<Link
											component='button'
											onClick={() => scrollToArticle(`chapter-${chapterIndex}`)}
											underline='hover'
											color='text.primary'
											sx={{ display: 'block', textAlign: 'left', fontSize: 14, fontWeight: 700, py: 0.5 }}
										>
											{chapter.title}
										</Link>
										{chapter.articles.map((article) => {
											const articleIndex = chapters[chapterIndex].articles.findIndex((item) => item.title === article.title);
											return (
												<Link
													key={article.title}
													component='button'
													onClick={() => scrollToArticle(`article-${chapterIndex}-${articleIndex}`)}
													underline='hover'
													color='text.secondary'
													sx={{ display: 'block', textAlign: 'left', fontSize: 13, pl: 1, py: 0.25 }}
												>
													第{getArticleNumber(chapterIndex, articleIndex)}条　{article.title}
												</Link>
											);
										})}
									</Box>
								);
							})}
						</Stack>
					</Paper>

					<Stack spacing={4}>
						{visibleChapters.length === 0 ?
							<Typography color='text.secondary'>該当する条文はありません。</Typography>
						:	visibleChapters.map((chapter) => {
								const chapterIndex = chapters.findIndex((item) => item.title === chapter.title);
								return (
									<Box key={chapter.title} id={`chapter-${chapterIndex}`} sx={{ scrollMarginTop: 88 }}>
										<Typography variant='h6' component='h2' sx={{ fontWeight: 700, mb: 1.5 }}>
											{chapter.title}
										</Typography>
										<Stack spacing={1.5}>
											{chapter.articles.map((article) => {
												const articleIndex = chapters[chapterIndex].articles.findIndex(
													(item) => item.title === article.title,
												);
												return (
													<Paper
														key={article.title}
														id={`article-${chapterIndex}-${articleIndex}`}
														variant='outlined'
														sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1, scrollMarginTop: 88 }}
													>
														<Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700, mb: 1 }}>
															第{getArticleNumber(chapterIndex, articleIndex)}条　{article.title}
														</Typography>
														{article.paragraphs.map((paragraph, paragraphIndex) => (
															<Box key={paragraphIndex} sx={{ '& + &': { mt: 0.75 } }}>
																<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
																	{paragraph}
																</ReactMarkdown>
															</Box>
														))}
													</Paper>
												);
											})}
										</Stack>
									</Box>
								);
							})
						}
						<Divider />
						<Box>
							<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
								附則
							</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
								施行日: 2026年10月1日
							</Typography>
						</Box>
					</Stack>
				</Box>
			</Stack>
		</Container>
	);
}

export default PassengerRegulations;
