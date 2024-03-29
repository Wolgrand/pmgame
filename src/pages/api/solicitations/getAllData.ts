import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from 'faunadb';
import { authClient, guestClient } from "../../../utils/fauna-client";
import { getAuthCookie } from "../../../utils/auth-cookies";


type Solicitation = {
  ref: {
      id: string;
  }
  data: {
    title: string,
    description: string,
    score: string,
    icon: number,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse<Solicitation[] | any >) => {

    try {
      const solicitations = await guestClient.query<Solicitation>(
        q.Map(
          q.Paginate(
            q.Match(
              q.Index('solicitation_by_status'),
              "Aprovada"
            ),
            {size: 20000}
          ),
          q.Lambda("X",
          q.Get(
            q.Var("X")
          ))
        )
      );
      // ok
      res.status(200).json(solicitations.data);
    } catch (e) {
      // something went wrong
      res.status(500).json({ error: e.message });
    }
};
