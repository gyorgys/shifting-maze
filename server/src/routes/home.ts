import { Request, Response } from 'express';

export interface HomeResponse {
  system_message: string;
}

export const getHome = (req: Request, res: Response): void => {
  const response: HomeResponse = {
    system_message: "Hello, User!"
  };

  res.json(response);
};
