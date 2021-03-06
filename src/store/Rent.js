import moment from 'moment';
import { observable, action, flow, computed, makeObservable } from 'mobx';
import { useApiFetch } from '../utils/fetch';
export default class Rent {
  selected = {};
  filters = { searchText: '', status: '' };
  _period = moment();
  items = [];
  countAll;
  countPaid;
  countPartiallyPaid;
  countNotPaid;
  totalToPay;
  totalPaid;
  totalNotPaid;

  constructor() {
    makeObservable(this, {
      selected: observable,
      filters: observable,
      items: observable,
      countAll: observable,
      countPaid: observable,
      countPartiallyPaid: observable,
      countNotPaid: observable,
      totalToPay: observable,
      totalPaid: observable,
      totalNotPaid: observable,
      period: computed,
      filteredItems: computed,
      setSelected: action,
      setFilters: action,
      setPeriod: action,
      fetch: flow,
      fetchOneTenantRent: flow,
      fetchTenantRents: flow,
      pay: flow,
      sendEmail: flow
    });
  }

  get period() {
    return this._period.format('YYYY.MM');
  }

  get filteredItems() {
    let filteredItems = this.filters.status === '' ? this.items : this.items.filter(({ status }) => {
      if (status === this.filters.status) {
        return true;
      }

      return false;
    });

    if (this.filters.searchText) {
      const regExp = /\s|\.|-/ig;
      const cleanedSearchText = this.filters.searchText.toLowerCase().replace(regExp, '')

      filteredItems = filteredItems.filter(({ occupant: { isCompany, name, manager, contacts } }) => {
        // Search match name
        let found = name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) != -1;

        // Search match manager
        if (!found && isCompany) {
          found = manager.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) != -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            .map(({ contact = '', email = '', phone = '' }) => ({
              contact: contact.replace(regExp, '').toLowerCase(),
              email: email.toLowerCase(),
              phone: phone.replace(regExp, '')
            }))
            .filter(({ contact, email, phone }) => (
              contact.indexOf(cleanedSearchText) != -1 ||
              email.indexOf(cleanedSearchText) != -1 ||
              phone.indexOf(cleanedSearchText) != -1
            ))
            .length;
        }
        return found;
      });
    }
    return filteredItems;
  }
  setSelected = rent => this.selected = rent;

  setFilters = ({ searchText = '', status = '' }) => this.filters = { searchText, status };

  setPeriod = period => this._period = period;

  *fetch() {
    try {
      const year = this._period.year();
      const month = this._period.month() + 1;

      const response = yield useApiFetch().get(`/rents/${year}/${month}`);

      this.countAll = response.data.overview.countAll;
      this.countPaid = response.data.overview.countPaid;
      this.countPartiallyPaid = response.data.overview.countPartiallyPaid;
      this.countNotPaid = response.data.overview.countNotPaid;
      this.totalToPay = response.data.overview.totalToPay;
      this.totalPaid = response.data.overview.totalPaid;
      this.totalNotPaid = response.data.overview.totalNotPaid;

      this.items = response.data.rents;
      if (this.selected._id) {
        this.selected = this.items.find(item => item._id === this.selected._id) || {};
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error.response.status };
    }
  };

  *fetchOneTenantRent(tenantId) {
    try {
      const year = this._period.year();
      const month = this._period.month() + 1;

      const response = yield useApiFetch().get(`/rents/tenant/${tenantId}/${year}/${month}`);

      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error.response.status };
    }
  };

  *fetchTenantRents(tenantId) {
    try {
      const response = yield useApiFetch().get(`/rents/tenant/${tenantId}`);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error.response.status };
    }
  };

  *pay(payment) {
    try {
      const response = yield useApiFetch().patch(`/rents/payment/${payment._id}`, payment);
      const rent = response.data;
      const index = this.items.findIndex(item => item._id === payment._id);
      if (index > -1) {
        this.items.splice(index, 1, rent);
        if (this.selected._id === payment._id) {
          this.selected = this.items[index];
        }
      }
      return 200;
    } catch (error) {
      return error.response.status;
    }
  };

  // payload
  // {
  //   document,
  //   tenantIds,
  //   year,
  //   month
  // }
  *sendEmail(payload) {
    try {
      yield useApiFetch().post('/emails', payload);
      return 200;
    } catch (error) {
      return error.response.status;
    }
  };
}
