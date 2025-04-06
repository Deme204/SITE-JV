// Exemple de test pour un composant GiftCardItem
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GiftCardItem from '../components/gift-cards/GiftCardItem';

const mockStore = configureStore([]);

describe('GiftCardItem Component', () => {
  let store;
  const giftCard = {
    id: '1',
    title: 'Carte Amazon',
    price: 50,
    discount: 5,
    image: 'amazon.jpg'
  };

  beforeEach(() => {
    store = mockStore({
      cart: { items: [] }
    });
  });

  test('renders gift card information correctly', () => {
    render(
      <Provider store={store}>
        <GiftCardItem giftCard={giftCard} />
      </Provider>
    );
    
    expect(screen.getByText('Carte Amazon')).toBeInTheDocument();
    expect(screen.getByText('45 €')).toBeInTheDocument();  // Prix après remise
    expect(screen.getByText('-10%')).toBeInTheDocument();  // Badge de remise
  });

  test('adds gift card to cart when button is clicked', () => {
    render(
      <Provider store={store}>
        <GiftCardItem giftCard={giftCard} />
      </Provider>
    );
    
    fireEvent.click(screen.getByText('Ajouter au panier'));
    
    const actions = store.getActions();
    expect(actions[0].type).toBe('cart/addItem');
    expect(actions[0].payload).toEqual({
      id: '1',
      title: 'Carte Amazon',
      price: 50,
      discount: 5,
      quantity: 1,
      image: 'amazon.jpg'
    });
  });
});