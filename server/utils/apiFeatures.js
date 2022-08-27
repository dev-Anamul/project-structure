class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //!  // 1. query
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'limit', 'sort', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        /// 1b. advance query
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        // { difficulty: 'easy', duration: { gte: '5' } }
        // { difficulty: 'easy', duration: { $gte: '5' } }
        this.query = this.query.find(JSON.parse(queryStr));
        return this;

        // const query = Tour.find(JSON.parse(queryStr));
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            console.log(sortBy);

            this.query = this.query.sort(sortBy);
            // query = query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');

            // query = query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fieldsItem = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fieldsItem);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        console.log(skip);
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
