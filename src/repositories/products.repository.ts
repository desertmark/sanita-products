import { Database } from "@models/database.model";
import { inject, injectable } from "inversify";
import { SqlBaseRepository } from "./sql-base.repository";

const _filter = require("lodash/filter");
const { queryFilter, categoryFilter } = require("./articles-filter-factory");
const { DatabaseError } = require("../util/errors");
const { get, omit, isEmpty } = require("lodash");

@injectable()
export class ProductsRepository {
  constructor(@inject(SqlBaseRepository) private baseRepository: SqlBaseRepository) {}

  findById(productId: string) {
    return this.baseRepository.findById(productId, Database.Tables.Products);
  }

  // findByCode(code) {
  //     return this.Article.findOne({code: code}).populate('category');
  // }

  // /**
  //  * Query Articles table and paginates results.
  //  * @param {Number} page Page number. Default is 0.
  //  * @param {Number} pageSize Page Size. Default is 20.
  //  * @param {Object} filter filter object to search by code or partial description. Example is `{code:"00.00.55.03", description:"PVC"}`.
  //  * @param {Object | String} fields fields for the query to return. If not passed returns all of them. Pass it like ``{fieldName:1}`` or ``"fieldName1 fieldName2"``.
  //  * @returns {DocumentQuery<Article>} DocumentQuery<Article>. call ``then`` to get results.
  //  */
  // listArticles(page, size, sort = ['description', 'asc'], filter = {}) {
  //     const sortField = sort[0];
  //     const sortOrder = sort[1] === 'asc' ? 1 : -1;
  //     page = parseInt(page) || 0;
  //     size = parseInt(size) || 20;
  //     const mongoQueryFilter = queryFilter(filter);
  //     const commonPipeline = [
  //         { $match: mongoQueryFilter },
  //         {
  //             $lookup: {
  //                 from: 'categories',
  //                 localField: 'category',
  //                 foreignField: '_id',
  //                 as: 'category'
  //             }
  //         },
  //         { $unwind: '$category' },
  //         { $match:  categoryFilter(filter) },
  //         { $sort: { [sortField]: sortOrder } }
  //     ];
  //     const countPipeline = commonPipeline.concat([{ $count: "value" }]);
  //     const queryPipeline = commonPipeline.concat([{ $skip: page*size }, { $limit: size }]);
  //     const mainPipeline = [
  //         {
  //             $facet: {
  //                 total: countPipeline,
  //                 rows: queryPipeline,
  //             }
  //         },
  //     ]
  //     return this.Article.aggregate(mainPipeline).then(
  //         ([result]) => {
  //             return {
  //                 articles: this.toArticles(result.rows),
  //                 totalSize: get(result,'total[0].value', 0),
  //             }
  //     });
  // }

  // toArticles(rows) {
  //     return rows.map(row => {
  //         const category = new this.Category(row.category);
  //         const article = new this.Article(row);
  //         article.category = category;
  //         return article;
  //     });
  // }

  // createArticle(article) {
  //     return this.Article
  //     .create(article)
  //     .catch(err => {
  //         throw new DatabaseError(err);
  //     });
  // }

  // /**
  //  * Performs a partial article of the given fields. If succeeded returns the updated article.
  //  * @param {*} article
  //  */
  // updateArticle(article) {
  //     return this.Article.findByIdAndUpdate(article._id, { $set: article })
  //     .catch(err => {
  //         throw new DatabaseError(err);
  //     });
  // }

  // updateMany(filter, query) {
  //     return this.Article.updateMany(filter, query, {upsert: false})
  //     .catch(err => {
  //         throw new DatabaseError(err);
  //     });
  // }

  // updateByCodeRange(model) {
  //     const percentage = get(model, 'fields.price.percentage');
  //     const absolute = get(model, 'fields.price.absolute');
  //     const fields = omit(model.fields, 'price');
  //     const filter = {
  //         code: {
  //             $gte: model.from,
  //             $lte: model.to
  //         }
  //     };
  //     const query = {};
  //     if(!isEmpty(fields)) query.$set = fields;
  //     if(percentage) query.$mul = { listPrice: 1 + percentage };
  //     if(absolute) query.$inc = { listPrice: absolute };
  //     return this.updateMany(filter, query);
  // }

  // /**
  //  * Removes the article with the given id from the database.
  //  * @param {string} id
  //  */
  // removeArticle(id) {
  //     return this.Article.findByIdAndRemove(id)
  //     .catch(err => new DatabaseError(err));
  // }
}