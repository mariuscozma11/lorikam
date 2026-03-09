import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createBrandWorkflow } from "../../../workflows/create-brand";
import { z } from "@medusajs/framework/zod";
import { PostAdminCreateBrand } from "./validators";

type PostAdminCreateBrandType = z.infer<typeof PostAdminCreateBrand>;

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");
  const { data: brands, metadata: { count, take, skip } = {} } =
    await query.graph({ entity: "brand", ...req.queryConfig });
  res.json({ brands, count, limit: take, offset: skip });
};

export const POST = async (
  req: MedusaRequest<PostAdminCreateBrandType>,
  res: MedusaResponse,
) => {
  const { result } = await createBrandWorkflow(req.scope).run({
    input: req.validatedBody,
  });
  res.json({ brand: result });
};
