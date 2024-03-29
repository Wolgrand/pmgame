import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from 'faunadb';
import { authClient, guestClient } from "../../../utils/fauna-client";
import { getAuthCookie } from "../../../utils/auth-cookies";
import { format, getTime, parse, parseISO } from "date-fns";

type PlayerList = {
  data: Player[]
}
type Task = {
  month: string,
  created_at: string,
  score: number
}

type Badge = {
  month: string,
  created_at: string,
  score: number
}

type Player = {
  ref: {
      id: string;
  }
  data: {
    name: string,
    tasks: Task[],
    department: string,
    badges: Badge[],
    role: string,
    position_log: {},
    image_url: string,
    score: number,
    position: number,
    old_position: number,
    score_extract:[]
  }
}

export default async (req: NextApiRequest, res: NextApiResponse<Player |any >) => {
  const token = getAuthCookie(req);
  
  if (!token) {
    return res.status(401).send('Auth cookie not found');
  }
  
  if(req.method === 'GET'){

      
    const {query: { id },} = req;

    
    
    try {
      const rawPlayers = await guestClient.query<PlayerList>(
        q.Map(
          q.Paginate(
            q.Match(
              q.Index('all_players'),
              'Jogador'
            )
          ),
          q.Lambda("X",
          q.Get(
            q.Var("X")
          ))
        )
      );
      
      const players = rawPlayers?.data?.map(player => {
        return {
          id: player['ref']['@ref']?.id,
          name: player?.data?.name,
          department: player?.data?.department,
          role: player?.data?.role,
          position: player?.data?.position,
          old_position: player?.data?.old_position,
          badges: player?.data?.badges,
          position_log: player?.data?.position_log,
          tasks: player?.data?.tasks,
          score: player?.data?.score,
          image_url: player?.data?.image_url,
        };
      })
    

      let playerPerformanceList = []

      players?.map(player => {
        let taskPerformance = []
        let accScore = 0
        player?.tasks?.map(task => {
          const splitedDate = task.created_at.split('/')
          const date = getTime(new Date(Number(splitedDate[2]), Number(splitedDate[1])-1, Number(splitedDate[0])))
          taskPerformance.push({
            x: date,
            y: task.score
          })
        })
        player?.badges?.map(task => {
          const splitedDate = task.created_at.split('/')
          const date = getTime(new Date(Number(splitedDate[2]), Number(splitedDate[1])-1, Number(splitedDate[0])))
          taskPerformance.push({
            x: date,
            y: task.score
          })
        })
        var data = taskPerformance,
        hash = Object.create(null),
        result;
      
        for (let { x, y } of data) {
            if (hash[x]) hash[x] += y;
            else hash[x] = y;
        }
  
       
        result = Object
            .entries(hash)
            .map(([x, y]) => ({ x: x, y }));
  
        let performance = []
           
        const sortedResult = result.sort(function(a, b) { return a.x - b.x;});
  
        sortedResult.map(item =>{
          accScore += item.y
            performance.push([Number(item.x), accScore])
        })
        playerPerformanceList.push({name:player?.name, data: performance })
      })

      

      // ok
      res.status(200).json([players, playerPerformanceList])
    } catch (e) {
      // something went wrong
      res.status(500).json({ error: e.message });
    }
  }else {
    res.setHeader('Allow', 'GET')
    res.status(405).end('Method not allowed')
}
};


