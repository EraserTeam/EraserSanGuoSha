interface ICreateCardSubclass {
    name: ICreateCardClass['name'];
    fullName: ICardClass['fullName'];
    tipFullName: ICardClass['tipFullName'];
    init?: ICreateCardClass['init'];
}
