#!/usr/bin/env node
/**
 * Seed a small set of SAMPLE community content so /stories, /guestbook and a
 * few lesson comment threads are not empty on day one.
 *
 *   node --env-file=.env scripts/seed-samples.mjs            insert (replacing any earlier samples)
 *   node --env-file=.env scripts/seed-samples.mjs --remove   remove every sample row and the sample profile
 *
 * Everything here is FICTIONAL. The people do not exist and no company is
 * named: employers are described ("a mid-size IT services company"), never
 * identified, so nothing reads as a real testimonial. Every row is owned by one
 * profile named "Sample data" and marked `sample = true`; the public API
 * returns `sample: true` on it, the pages show a "Sample" badge, public counts
 * leave it out, and /admin → Content has a button that removes all of it.
 *
 * Re-running is safe: earlier sample rows are deleted first, in the same
 * transaction, so there is only ever one set.
 */
import { Client, neonConfig } from '@neondatabase/serverless'

const PROFILE = { id: 'sample-data', email: 'sample-data@example.invalid', name: 'Sample data' }

const DAY = 24 * 3600 * 1000
const ago = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600 * 1000).toISOString()

const STORIES = [
  {
    title: 'From a tier-3 college in Bihar to my first offer in Bengaluru',
    from: 'Darbhanga, Bihar',
    to: 'Bengaluru',
    company: 'a large IT services company',
    package: '3.6 LPA',
    status: 'featured',
    votes: 41,
    at: ago(19, 3),
    body: `My college had no placement cell worth the name, so I stopped waiting for one. I moved to Bengaluru with savings for three months and shared a room in Marathahalli with two others from my district.

The first six weeks went on the written round. I failed four aptitude tests in a row, all on time, not on difficulty. I practised twenty questions a day against a timer, and the fifth test I cleared with ten minutes spare.

The technical interview was mostly SQL joins and one question on normalisation. I got the offer letter on day 71. It is not a big package, and I know that, but it is a start and it is mine.`
  },
  {
    title: 'Five years in a BPO, then a switch to manual QA',
    from: 'Voice process, Hyderabad',
    to: 'QA engineer, Bengaluru',
    company: 'a mid-size IT services company',
    package: '4.2 LPA',
    status: 'visible',
    votes: 27,
    at: ago(15, 7),
    body: `I was 29 and every job description said "freshers only". I worked night shifts in a voice process and studied in the mornings, mostly testing basics and SQL, because that was the door that looked least locked.

What worked was writing test cases for real apps I used every day and putting them in a public folder. In the interview they asked me to test a login page on the spot. I had done that exercise so many times it felt like a conversation.

My advice: do not hide the BPO years. Handling angry customers is exactly the skill a good bug report needs.`
  },
  {
    title: 'Salesforce admin after a commerce degree',
    from: 'B.Com, Mysuru',
    to: 'Salesforce administrator, Bengaluru',
    company: 'a small Salesforce consulting partner',
    package: '5 LPA',
    status: 'visible',
    votes: 19,
    at: ago(12, 2),
    body: `I did not write a line of code for the first four months. I learned how a CRM is shaped: objects, fields, page layouts, validation rules, reports. The free learning trails were enough to pass the admin certification on the second attempt.

The interview was a screen share where they asked me to build a small approval process from scratch. I talked through every click, and that seemed to matter more than speed.

Commerce helped more than I expected. Half of admin work is understanding how a sales team actually sells.`
  },
  {
    title: 'Excel to SQL to a data analyst role',
    from: 'Accounts assistant, Pune',
    to: 'Data analyst, Bengaluru',
    company: 'a fintech start-up',
    package: '6.5 LPA',
    status: 'visible',
    votes: 23,
    at: ago(9, 5),
    body: `I was already the person in my office who fixed everyone's spreadsheets. The move was learning to do the same thing in SQL, then in a dashboard tool, with data too big for Excel.

I built three small projects on public datasets and wrote one page on each: the question, the query, the chart, what I would do next. Two interviewers asked about the same project, and I could answer because I had written it down.

Window functions were the hardest part. I got stuck on them for two weeks and they came up in the final round.`
  },
  {
    title: 'Eight months in and still searching',
    from: 'Ranchi, Jharkhand',
    to: 'Bengaluru (still looking)',
    company: null,
    package: null,
    status: 'visible',
    votes: 34,
    at: ago(6, 1),
    body: `This is not a success story yet. I have applied to around 300 openings, cleared the written round eleven times, and lost in the technical round every time so far.

What changed last month: I stopped applying everywhere and started preparing for one kind of role, Java backend, properly. My last two technical rounds went much further than the ones before.

I am writing this for the people reading the success stories and feeling behind. You are not the only one still at it. I will update this when something changes.`
  },
  {
    title: '2024 batch, ECE, and the support desk nobody told me about',
    from: 'B.Tech ECE, Vijayawada',
    to: 'Technical support engineer, Bengaluru',
    company: 'a mid-size IT services company',
    package: '2.8 LPA',
    status: 'visible',
    votes: 12,
    at: ago(5, 9),
    body: `Everyone in my batch was chasing developer roles and most of us were getting nothing. I am from ECE, not CS, and in the developer queue that was one more filter against me.

A senior told me to look at technical support roles instead. I did not like the sound of it at first. Then I read the job description properly: Linux basics, SQL, networking, exactly the subjects I could learn in weeks rather than years.

I prepared three things: how to read a log file, the SQL track here, and how DNS works. The interview was forty minutes of "a customer says the app is slow, what do you do". I got the offer in the second week of trying this route.

The plan is two years of support, learning the product deeply, then an internal move to the engineering team. Two people in my current team have done exactly that. It is a side door, but it is a door, and 2.8 LPA in hand beats a fourth year of applying.`
  },
  {
    title: 'Back after three years at home, into testing',
    from: 'Career break, Salem',
    to: 'QA engineer, Bengaluru',
    company: 'a product company in health tech',
    package: '5.5 LPA',
    status: 'visible',
    votes: 21,
    at: ago(2, 11),
    body: `I left a junior developer job in 2021 when my daughter was born, and when I started applying again the gap was the first thing every interviewer saw. A few said it out loud. Most just never called back.

What changed things was treating the gap as a fact and not an apology. One line in the resume: career break, family, 2021 to 2024. Then I made the rest of the page about what I could do now, not what I did before.

I chose testing because it let me rebuild in months. I wrote test plans for two apps I use daily, learned SQL again from this guide, and did one course on an automation tool. In interviews I answered the gap question the same way every time: here is what I did, here is what I can do today, ask me anything technical.

The company that hired me never made the gap a thing. Those are the ones to find. To every woman reading this in year two or three of a break: the skills come back much faster than the confidence, so start before you feel ready.`
  },
  {
    title: 'A frontend role after teaching myself in the evenings',
    from: 'Mechanical engineer, Coimbatore',
    to: 'Frontend developer, Bengaluru',
    company: 'a product company in e-commerce logistics',
    package: '7 LPA',
    status: 'visible',
    votes: 15,
    at: ago(3, 6),
    body: `I worked in a plant during the day and learned HTML, CSS and JavaScript at night for about a year. The turning point was rebuilding the same small app three times: once in plain JavaScript, once with a framework, once with tests.

In the interview they gave me a broken component and asked me to find the bug. I found it by reading the error message slowly, which is a habit this guide drills and I am grateful for it.

Mechanical engineering still shows up: I think about layouts the way I used to think about tolerances.`
  }
]

const GUESTBOOK = [
  { name: 'Asha, Patna', message: 'Found this the week I moved to Bengaluru. The page on where to live saved me a bad deposit.', learned: 'Check the lease before paying anything, and never pay in cash without a receipt.', at: ago(18, 4) },
  { name: 'Rohit', message: 'The aptitude timer practice is the reason I cleared my first written round.', learned: 'Speed comes from doing the same kind of question many times, not from new tricks.', at: ago(16, 9) },
  { name: 'Meenakshi', message: 'Thank you for writing this in plain English. I shared it with my whole hostel.', learned: 'A join is two tables agreeing on one column. That sentence finally made it click.', at: ago(13, 2) },
  { name: 'Imran from Lucknow', message: 'Still searching, but I feel less alone after reading the stories.', learned: 'Prepare for one kind of role properly instead of applying for everything.', at: ago(11, 6) },
  { name: 'Divya', message: 'The interview question sections are gold. Used three of them word for word.', learned: 'Say what a good answer contains before you give the answer.', at: ago(8, 1) },
  { name: 'Karthik', message: 'Switched from BPO to QA. This guide was one of my main resources.', learned: 'A bug report is a small story: what I did, what I expected, what happened.', at: ago(5, 8) },
  // Kept in time order: the page shows newest first by id, so inserts must
  // run oldest to newest or the dates read out of sequence.
  { name: 'Pooja, Nagpur', message: 'Restarting after a break and the stories section is the only place that does not make me feel late.', learned: 'A career gap is a fact to state, not a fault to explain.', at: ago(4, 10) },
  { name: 'Arvind', message: 'ECE grad here. The support engineer route mentioned in a story got me my first interview call in months.', learned: 'The developer queue is not the only queue.', at: ago(3, 5) },
  { name: 'Neha, Indore', message: 'Please add more on the HR round. Loved the SQL track.', learned: 'GROUP BY runs before SELECT, which is why the alias does not work there.', at: ago(2, 3) },
  { name: 'Fathima', message: 'Cleared my first technical round today. The joins lesson came up almost word for word.', learned: 'Draw the two tables before writing the join, every time.', at: ago(1, 12) },
  { name: 'Sandeep', message: 'Signing from a PG in BTM Layout at 1 am. Keep going, everyone.', learned: 'Write down what you learned every day, even one line.', at: ago(0, 20) },
  { name: 'Vikram, Hubli', message: 'Reading this on the bus to my third walk-in this week. The walk-in checklist is stuck to my folder.', learned: 'Carry six printed copies of the resume, not two.', at: ago(0, 6) }
]

const COMMENTS = [
  { path: '/sql/joining/inner-and-outer-joins', body: 'The drawing of the left join with the empty right side finally made outer joins make sense to me.', at: ago(14, 5) },
  { path: '/sql/joining/inner-and-outer-joins', body: 'Tip for others: run the exercise once with INNER and once with LEFT and compare the row counts.', at: ago(10, 3) },
  { path: '/sql/joining/inner-and-outer-joins', body: 'Question: if I LEFT JOIN and then filter on a column from the right table in WHERE, why do my NULL rows disappear?', at: ago(6, 8) },
  { path: '/sql/joining/inner-and-outer-joins', body: 'Answering the question above: WHERE runs after the join, and NULL fails almost every comparison, so the outer rows get filtered out. Put that condition in the ON clause instead and the NULL rows stay. It comes up in interviews a lot.', at: ago(6, 2) },
  { path: '/dbms/transactions/acid', body: 'Got asked exactly the isolation question in an interview last week.', at: ago(7, 2) },
  { path: '/dbms/normalisation/anomalies', body: 'The admissions table example is much clearer than the one in my college notes.', at: ago(4, 7) },
  { path: '/sql/joining/subqueries', body: 'I kept writing a subquery where a join would do. The compare block showed me why that matters.', at: ago(1, 4) },
  { path: '/java/first-steps/why-java-jdk-jre-jvm', body: 'So when the interviewer asks what the JVM is, is "the thing that runs the bytecode" enough or do they expect more?', at: ago(9, 6) },
  { path: '/java/first-steps/why-java-jdk-jre-jvm', body: 'On the question above: that one line is a pass, but the follow-up is always "then what is the JDK for". Say the JDK is what you install to write and compile, the JVM is what runs the result, and you have covered both.', at: ago(9, 1) },
  { path: '/java/first-steps/why-java-jdk-jre-jvm', body: 'I had java 8 and java 17 both installed and could not work out which one was running. java -version and where the PATH points cleared it up, exactly as this lesson warned.', at: ago(3, 9) },
  { path: '/interview/tell-me-about-yourself/the-template', body: 'Used this template in a mock interview at my institute today. The trainer stopped me halfway and asked where I learned to structure it.', at: ago(8, 4) },
  { path: '/interview/tell-me-about-yourself/the-template', body: 'Does the template still work if my story is mostly a gap? I have eighteen months of nothing after graduation and I freeze at this question.', at: ago(5, 7) },
  { path: '/interview/tell-me-about-yourself/the-template', body: 'For the gap question above: the template holds, you just spend the middle beat on what you did inside the gap, even if that is only the last three months of proper study. Naming the gap yourself, calmly, works far better than hoping nobody asks.', at: ago(5, 3) }
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/seed-samples.mjs')
    process.exit(1)
  }
  if (typeof WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = WebSocket
  }
  const remove = process.argv.includes('--remove')
  const client = new Client(url)
  await client.connect()
  try {
    const { rows: [check] } = await client.query(`select count(*)::int as n from information_schema.columns
      where table_schema = 'public' and table_name in ('stories', 'guestbook', 'comments') and column_name = 'sample'`)
    if (check.n !== 3) {
      throw new Error('The `sample` columns are missing. Run `pnpm db:migrate` first.')
    }

    await client.query('begin')
    const removed = {
      stories: (await client.query('delete from stories where sample')).rowCount,
      guestbook: (await client.query('delete from guestbook where sample')).rowCount,
      comments: (await client.query('delete from comments where sample')).rowCount
    }

    if (remove) {
      await client.query(`delete from profiles p where p.id = $1
        and not exists (select 1 from stories where user_id = p.id)
        and not exists (select 1 from guestbook where user_id = p.id)
        and not exists (select 1 from comments where user_id = p.id)`, [PROFILE.id])
      await client.query('commit')
      console.log(`Removed ${removed.stories} stories, ${removed.guestbook} guestbook entries and ${removed.comments} comments.`)
      return
    }

    await client.query(`insert into profiles (id, email, name, image) values ($1, $2, $3, null)
      on conflict (id) do update set name = excluded.name, email = excluded.email`, [PROFILE.id, PROFILE.email, PROFILE.name])

    for (const s of STORIES) {
      await client.query(`insert into stories
        (user_id, title, from_place, to_place, company, package, body, status, votes, created_at, sample)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [PROFILE.id, s.title, s.from, s.to, s.company, s.package, s.body, s.status, s.votes, s.at])
    }
    for (const g of GUESTBOOK) {
      await client.query(`insert into guestbook (user_id, name, message, learned, created_at, sample)
        values ($1, $2, $3, $4, $5, true)`, [PROFILE.id, g.name, g.message, g.learned, g.at])
    }
    for (const c of COMMENTS) {
      await client.query(`insert into comments (path, user_id, body, ts, sample)
        values ($1, $2, $3, $4, true)`, [c.path, PROFILE.id, c.body, c.at])
    }
    await client.query('commit')

    const replaced = removed.stories + removed.guestbook + removed.comments
    console.log(`Seeded ${STORIES.length} stories, ${GUESTBOOK.length} guestbook entries and ${COMMENTS.length} comments, all marked sample${replaced ? ` (replaced ${replaced} earlier sample rows)` : ''}.`)
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

await main()
