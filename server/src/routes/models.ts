import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export type CarModel = {
  id: number; model_name: string; trim: string; msrp: number;
  body_type: string; mpg: string; awd: boolean; good_lease: boolean; blurb: string;
};

const models: CarModel[] = [
  { id:1, model_name:"Corolla Hybrid LE", trim:"Base", msrp:24000, body_type:"Sedan", mpg:"50", awd:false, good_lease:true,  blurb:"Efficient daily driver" },
  { id:2, model_name:"Camry SE",          trim:"SE",   msrp:29500, body_type:"Sedan", mpg:"33", awd:true,  good_lease:true,  blurb:"Comfort with punch" },
  { id:3, model_name:"RAV4 LE",           trim:"LE",   msrp:28500, body_type:"SUV",   mpg:"30", awd:true,  good_lease:false, blurb:"All-round family pick" },
  { id:4, model_name:"RAV4 Hybrid XLE",   trim:"XLE",  msrp:32500, body_type:"SUV",   mpg:"40", awd:true,  good_lease:true,  blurb:"Hybrid utility" },
  { id:5, model_name:"Prius",             trim:"Base", msrp:28000, body_type:"Sedan", mpg:"57", awd:false, good_lease:true,  blurb:"Peak efficiency" },
  { id:6, model_name:"Highlander",        trim:"Base", msrp:38500, body_type:"SUV",   mpg:"24", awd:true,  good_lease:false, blurb:"3-row comfort" },
  { id:7, model_name:"Tacoma SR5",        trim:"SR5",  msrp:34500, body_type:"Truck", mpg:"21", awd:true,  good_lease:false, blurb:"Weekend warrior" },
  { id:8, model_name:"GR Corolla",        trim:"Core", msrp:36000, body_type:"Hatch", mpg:"28", awd:true,  good_lease:false, blurb:"Hot hatch fun" }
];

const r = Router();

r.get("/models", requireAuth, (_req, res) => {
  res.json({ models });
});

export default r;
